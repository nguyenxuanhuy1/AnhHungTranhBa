import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * pino-pretty chỉ là devDependency (log production phải là JSON để máy đọc).
 * Kiểm tra xem có cài không thay vì mặc định là có — nếu không, chạy
 * `npm ci --omit=dev` mà quên đặt NODE_ENV là server sập ngay lúc khởi động
 * với thông báo lỗi chẳng liên quan gì tới nguyên nhân thật.
 */
function prettyAvailable(): boolean {
  try {
    require.resolve('pino-pretty')
    return true
  } catch {
    return false
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),

  // Che dữ liệu nhạy cảm trước khi ghi log.
  // Log lộ token còn nguy hiểm hơn không có log, vì file log thường được
  // gom về dịch vụ bên thứ ba và giữ lại rất lâu.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.refresh_token',
      'req.body.poll_secret',
      'req.body.id_token',
      'res.headers["set-cookie"]',
      '*.refresh_token',
      '*.access_token',
      '*.client_secret',
    ],
    censor: '[ĐÃ CHE]',
  },

  transport:
    isDev && prettyAvailable()
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
})
