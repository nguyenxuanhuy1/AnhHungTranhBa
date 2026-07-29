import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { config } from './config'
import { closePool, pool } from './db'
import { globalLimiter } from './middleware/rate_limit'
import { authRouter } from './routes/auth'
import { cleanupExpired } from './services/tokens'
import { AuthError } from './util/errors'
import { logger } from './util/logger'

const app = express()

// Chạy sau reverse proxy thì phải bật, nếu không req.ip luôn là IP của proxy
// và rate limit sẽ tính chung cho tất cả mọi người.
// Bật khi KHÔNG thực sự có proxy cũng nguy hiểm: kẻ tấn công tự đặt
// X-Forwarded-For để vượt rate limit. Chỉ bật đúng lúc cần.
if (config.TRUST_PROXY) {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        // Trang callback dùng <style> nội tuyến — cần cho phép riêng mục này.
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'unsafe-inline'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // Ép trình duyệt chỉ dùng HTTPS trong 180 ngày.
    hsts: config.isProd ? { maxAge: 15_552_000, includeSubDomains: true } : false,
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
  }),
)

app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/health' },
  }),
)

// Giới hạn kích thước body. Không có giới hạn là mở cửa cho tấn công
// làm cạn bộ nhớ bằng payload khổng lồ.
app.use(express.json({ limit: '16kb' }))

app.use(globalLimiter)

// KHÔNG bật CORS.
// Game Godot gọi API bằng HTTP client thuần, không phải trình duyệt,
// nên không cần CORS. Bật CORS rộng rãi chỉ tạo thêm rủi ro.
// Nếu sau này làm bản web (HTML5 export), hãy bật cors() với
// origin cụ thể của trang web đó, tuyệt đối không dùng '*'.

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, service: 'auth', time: new Date().toISOString() })
  } catch {
    res.status(503).json({ ok: false, error: 'database_unavailable' })
  }
})

app.use('/auth', authRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Không tìm thấy endpoint.' })
})

// ---------------------------------------------------------------------
// Xử lý lỗi tập trung.
// Client chỉ nhận mã lỗi ổn định + thông báo chung chung.
// Chi tiết thật chỉ nằm trong log của server.
// ---------------------------------------------------------------------
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AuthError) {
    if (err.status >= 500) {
      logger.error({ err, detail: err.logDetail, path: req.path }, err.code)
    } else {
      logger.warn({ code: err.code, detail: err.logDetail, path: req.path }, err.publicMessage)
    }
    res.status(err.status).json({ error: err.code, message: err.publicMessage })
    return
  }

  logger.error({ err, path: req.path }, 'Lỗi không lường trước')
  res.status(500).json({ error: 'internal_error', message: 'Lỗi hệ thống. Vui lòng thử lại sau.' })
})

// ---------------------------------------------------------------------
// Khởi động
// ---------------------------------------------------------------------
const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV, redirect: config.googleRedirectUri },
    `Auth service đang chạy tại ${config.PUBLIC_BASE_URL}`,
  )
  logger.info(
    'Nhớ dán đúng URI này vào Google Cloud Console → Authorized redirect URIs: ' +
      config.googleRedirectUri,
  )
})

// Dọn phiên và token hết hạn mỗi giờ.
// Với hệ thống lớn nên tách ra thành cron job riêng thay vì chạy trong
// tiến trình API — nhiều instance API sẽ cùng dọn một lúc, tuy vô hại
// nhưng lãng phí.
const cleanupTimer = setInterval(() => {
  cleanupExpired().catch((err) => logger.error({ err }, 'Dọn dữ liệu hết hạn thất bại'))
}, 60 * 60 * 1000)
cleanupTimer.unref()

// Tắt êm: ngừng nhận request mới, chờ request đang chạy xong, rồi đóng DB.
// Thiếu bước này thì mỗi lần deploy sẽ cắt ngang vài người chơi đang đăng nhập.
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Đang tắt service...')
  clearInterval(cleanupTimer)

  server.close(async () => {
    await closePool().catch(() => {})
    logger.info('Đã tắt.')
    process.exit(0)
  })

  setTimeout(() => {
    logger.warn('Quá thời gian chờ, tắt cưỡng bức.')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
