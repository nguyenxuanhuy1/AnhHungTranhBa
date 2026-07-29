import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { config } from '../config'
import { pool, queryOne } from '../db'
import { claimLimiter, createSessionLimiter, refreshLimiter } from '../middleware/rate_limit'
import { requireAuth } from '../middleware/require_auth'
import { assertCanLogin, findOrCreateFromGoogle, getAccount, requestAccountDeletion } from '../services/accounts'
import { audit } from '../services/audit'
import { buildAuthorizeUrl, exchangeCodeForProfile } from '../services/google'
import {
  issueNewSession,
  revokeByRefreshToken,
  revokeFamily,
  rotateRefreshToken,
} from '../services/tokens'
import { generatePkce, randomToken, safeEqual, sha256 } from '../util/crypto'
import { AuthError, Errors } from '../util/errors'
import { logger } from '../util/logger'
import { deniedPage, errorPage, expiredPage, successPage } from '../views/pages'

export const authRouter = Router()

/** Express 4 không tự bắt lỗi từ handler async — bọc lại để lỗi đi vào error middleware. */
const h =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next)
  }

function ctxOf(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.get('user-agent') ?? null }
}

const POLL_INTERVAL_MS = 2500

// =====================================================================
//  BƯỚC 1 — Game tạo phiên đăng nhập
//
//  Game tự sinh một bí mật ngẫu nhiên, chỉ gửi lên SHA-256 của nó.
//  Server không bao giờ biết bí mật gốc, nên dù database hay log bị lộ
//  cũng không ai đổi được phiên này lấy token.
// =====================================================================

const createSessionSchema = z.object({
  poll_secret_hash: z
    .string()
    .regex(/^[a-f0-9]{64}$/, 'poll_secret_hash phải là SHA-256 dạng hex chữ thường'),
  client_version: z.string().max(32).optional(),
  platform: z.enum(['android', 'ios', 'windows', 'linux', 'macos', 'web', 'unknown']).optional(),
})

authRouter.post(
  '/session',
  createSessionLimiter,
  h(async (req, res) => {
    const parsed = createSessionSchema.safeParse(req.body)
    if (!parsed.success) {
      throw Errors.invalidRequest({ issues: parsed.error.issues })
    }

    const { state, nonce } = { state: randomToken(24), nonce: randomToken(24) }
    const pkce = generatePkce()
    const expiresAt = new Date(Date.now() + config.LOGIN_SESSION_TTL_SEC * 1000)

    const row = await queryOne<{ id: string }>(
      `INSERT INTO login_sessions
         (poll_secret_hash, state, nonce, code_verifier, expires_at, create_ip)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        Buffer.from(parsed.data.poll_secret_hash, 'hex'),
        state,
        nonce,
        pkce.verifier,
        expiresAt,
        req.ip ?? null,
      ],
    )

    if (!row) throw Errors.internal({ stage: 'create_session' })

    await audit('login.session_created', {
      ...ctxOf(req),
      meta: { platform: parsed.data.platform, clientVersion: parsed.data.client_version },
    })

    res.json({
      session_id: row.id,
      authorize_url: buildAuthorizeUrl({ state, nonce, codeChallenge: pkce.challenge }),
      expires_in: config.LOGIN_SESSION_TTL_SEC,
      poll_interval_ms: POLL_INTERVAL_MS,
    })
  }),
)

// =====================================================================
//  BƯỚC 2 — Google gọi về sau khi người chơi bấm đồng ý
//
//  Endpoint này chạy trong TRÌNH DUYỆT, không phải trong game.
//  Nó chỉ đánh dấu phiên là 'completed'. Token KHÔNG được tạo ở đây —
//  chờ tới lúc game đến nhận, để không phải lưu token ở bất kỳ đâu.
// =====================================================================

interface SessionRow {
  id: string
  nonce: string
  code_verifier: string
  status: 'pending' | 'completed' | 'claimed' | 'failed'
  expires_at: Date
}

authRouter.get(
  '/google/callback',
  h(async (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : null
    const code = typeof req.query.code === 'string' ? req.query.code : null
    const googleError = typeof req.query.error === 'string' ? req.query.error : null

    if (!state) {
      res.status(400).type('html').send(errorPage())
      return
    }

    const session = await queryOne<SessionRow>(
      `SELECT id, nonce, code_verifier, status, expires_at
       FROM login_sessions WHERE state = $1`,
      [state],
    )

    // State không khớp gì cả => hoặc là CSRF, hoặc phiên đã bị dọn.
    if (!session) {
      logger.warn({ ip: req.ip }, 'Callback với state không tồn tại')
      res.status(400).type('html').send(errorPage())
      return
    }

    if (session.expires_at.getTime() < Date.now()) {
      res.status(410).type('html').send(expiredPage())
      return
    }

    // Chỉ xử lý phiên còn 'pending'. Chặn việc phát lại cùng một callback.
    if (session.status !== 'pending') {
      res.status(409).type('html').send(errorPage())
      return
    }

    // Người chơi bấm "Huỷ" ở màn hình Google.
    if (googleError) {
      await pool.query(
        `UPDATE login_sessions SET status = 'failed', error_code = $2 WHERE id = $1`,
        [session.id, googleError.slice(0, 64)],
      )
      await audit('login.google_denied', { ...ctxOf(req), meta: { googleError } })
      res.status(200).type('html').send(deniedPage())
      return
    }

    if (!code) {
      await pool.query(
        `UPDATE login_sessions SET status = 'failed', error_code = 'missing_code' WHERE id = $1`,
        [session.id],
      )
      res.status(400).type('html').send(errorPage())
      return
    }

    try {
      const profile = await exchangeCodeForProfile({
        code,
        codeVerifier: session.code_verifier,
        expectedNonce: session.nonce,
      })

      const { account } = await findOrCreateFromGoogle(profile, ctxOf(req))
      assertCanLogin(account)

      await pool.query(
        `UPDATE login_sessions
         SET status = 'completed', account_id = $2, completed_at = now()
         WHERE id = $1 AND status = 'pending'`,
        [session.id, account.id],
      )

      await audit('login.google_success', { accountId: account.id, ...ctxOf(req) })

      res.status(200).type('html').send(successPage())
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'internal_error'

      await pool.query(
        `UPDATE login_sessions SET status = 'failed', error_code = $2 WHERE id = $1`,
        [session.id, code],
      )

      if (code === 'account_banned') {
        await audit('login.blocked_banned', { ...ctxOf(req) })
      } else {
        logger.error({ err }, 'Callback Google thất bại')
        await audit('login.google_failed', { ...ctxOf(req), meta: { code } })
      }

      res.status(200).type('html').send(errorPage())
    }
  }),
)

// =====================================================================
//  BƯỚC 3 — Game đến nhận kết quả
//
//  Game hỏi lại endpoint này mỗi ~2.5 giây cho tới khi có kết quả.
//  Chỉ nhận được ĐÚNG MỘT LẦN.
// =====================================================================

const claimSchema = z.object({
  session_id: z.string().uuid(),
  poll_secret: z.string().min(32).max(256),
})

interface ClaimRow {
  id: string
  poll_secret_hash: Buffer
  status: 'pending' | 'completed' | 'claimed' | 'failed'
  account_id: string | null
  error_code: string | null
  expires_at: Date
}

authRouter.post(
  '/session/claim',
  claimLimiter,
  h(async (req, res) => {
    const parsed = claimSchema.safeParse(req.body)
    if (!parsed.success) {
      throw Errors.invalidRequest({ issues: parsed.error.issues })
    }

    const session = await queryOne<ClaimRow>(
      `SELECT id, poll_secret_hash, status, account_id, error_code, expires_at
       FROM login_sessions WHERE id = $1`,
      [parsed.data.session_id],
    )

    if (!session) throw Errors.sessionNotFound()

    // Kiểm tra bí mật TRƯỚC khi tiết lộ bất cứ điều gì về trạng thái phiên.
    // Đảo thứ tự hai bước này là để lộ thông tin cho người không có quyền.
    if (!safeEqual(sha256(parsed.data.poll_secret), session.poll_secret_hash)) {
      logger.warn({ sessionId: session.id, ip: req.ip }, 'poll_secret sai')
      throw Errors.invalidCredentials({ reason: 'bad_poll_secret' })
    }

    if (session.expires_at.getTime() < Date.now()) throw Errors.sessionExpired()

    if (session.status === 'pending') {
      res.json({ status: 'pending' })
      return
    }

    if (session.status === 'failed') {
      res.json({ status: 'failed', error_code: session.error_code ?? 'unknown' })
      return
    }

    if (session.status === 'claimed') {
      throw Errors.sessionExpired()
    }

    // status === 'completed'
    // Cập nhật có điều kiện = khoá một lần duy nhất. Hai request đồng thời
    // thì chỉ một cái thấy status còn là 'completed'.
    const claimed = await queryOne<{ account_id: string }>(
      `UPDATE login_sessions
       SET status = 'claimed', claimed_at = now()
       WHERE id = $1 AND status = 'completed'
       RETURNING account_id`,
      [session.id],
    )

    if (!claimed?.account_id) throw Errors.sessionExpired()

    const account = await getAccount(claimed.account_id)
    if (!account) throw Errors.invalidCredentials({ reason: 'account_missing' })
    assertCanLogin(account)

    const tokens = await issueNewSession(account.id, ctxOf(req))
    await audit('login.claimed', { accountId: account.id, ...ctxOf(req) })

    res.json({
      status: 'ready',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      account: {
        id: account.id,
        display_name: account.display_name,
        created_at: account.created_at,
      },
    })
  }),
)

// =====================================================================
//  Làm mới token — game gọi khi access token sắp hết hạn,
//  và gọi một lần lúc mở game để đăng nhập lại tự động.
// =====================================================================

const refreshSchema = z.object({
  refresh_token: z.string().min(20).max(512),
})

authRouter.post(
  '/refresh',
  refreshLimiter,
  h(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body)
    if (!parsed.success) throw Errors.invalidRequest({ issues: parsed.error.issues })

    const tokens = await rotateRefreshToken(parsed.data.refresh_token, ctxOf(req))

    res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    })
  }),
)

// =====================================================================
//  Đăng xuất
// =====================================================================

authRouter.post(
  '/logout',
  h(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body)
    if (!parsed.success) throw Errors.invalidRequest({ issues: parsed.error.issues })

    const accountId = await revokeByRefreshToken(parsed.data.refresh_token)
    if (accountId) {
      await audit('account.logout', { accountId, ...ctxOf(req) })
    }

    // Luôn trả về thành công. Cho biết token có tồn tại hay không
    // là để lộ thông tin không cần thiết.
    res.json({ ok: true })
  }),
)

// =====================================================================
//  Thông tin tài khoản — dùng để game kiểm tra access token còn sống.
// =====================================================================

authRouter.get(
  '/me',
  requireAuth,
  h(async (req, res) => {
    const account = await getAccount(req.auth!.accountId)
    if (!account) throw Errors.invalidCredentials({ reason: 'account_missing' })
    assertCanLogin(account)

    res.json({
      id: account.id,
      display_name: account.display_name,
      status: account.status,
      created_at: account.created_at,
      last_login_at: account.last_login_at,
    })
  }),
)

// =====================================================================
//  Xoá tài khoản.
//  Google Play BẮT BUỘC phải có với app cho phép đăng ký tài khoản.
// =====================================================================

authRouter.delete(
  '/account',
  requireAuth,
  h(async (req, res) => {
    const accountId = req.auth!.accountId

    await requestAccountDeletion(accountId)
    await revokeFamily(req.auth!.familyId, 'account_deleted')
    await audit('account.delete_requested', { accountId, ...ctxOf(req) })

    res.json({
      ok: true,
      message: 'Tài khoản đã được đánh dấu xoá. Dữ liệu sẽ được xoá vĩnh viễn sau 30 ngày.',
    })
  }),
)
