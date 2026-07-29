import { pool } from '../db'
import { logger } from '../util/logger'

export type AuditEvent =
  | 'login.session_created'
  | 'login.google_success'
  | 'login.google_denied'
  | 'login.google_failed'
  | 'login.claimed'
  | 'login.blocked_banned'
  | 'token.refreshed'
  | 'token.reuse_detected'
  | 'token.family_revoked'
  | 'account.created'
  | 'account.logout'
  | 'account.delete_requested'

/**
 * Ghi nhật ký kiểm toán.
 *
 * Cố tình KHÔNG ném lỗi ra ngoài: nếu ghi log thất bại thì cũng không được
 * làm hỏng luồng đăng nhập của người chơi. Nhưng lỗi vẫn phải hiện trong log
 * ứng dụng để mình biết mà sửa.
 */
export async function audit(
  event: AuditEvent,
  opts: {
    accountId?: string | null
    ip?: string | null
    userAgent?: string | null
    meta?: Record<string, unknown>
  } = {},
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (account_id, event, ip, user_agent, meta)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        opts.accountId ?? null,
        event,
        opts.ip ?? null,
        opts.userAgent?.slice(0, 500) ?? null,
        JSON.stringify(opts.meta ?? {}),
      ],
    )
  } catch (err) {
    logger.error({ err, event }, 'Ghi audit_log thất bại')
  }
}
