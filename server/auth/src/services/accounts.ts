import type { PoolClient } from 'pg'
import { queryOne, withTransaction } from '../db'
import { Errors } from '../util/errors'
import type { GoogleProfile } from './google'
import { audit } from './audit'

export interface Account {
  id: string
  display_name: string
  status: 'active' | 'suspended' | 'banned' | 'deleted'
  role: 'player' | 'gm' | 'admin' | 'developer'
  ban_reason: string | null
  ban_expires_at: Date | null
  created_at: Date
  last_login_at: Date | null
}

/**
 * Chặn tài khoản không được phép đăng nhập.
 * Gọi hàm này ở MỌI nơi cấp token — cả lúc đăng nhập lẫn lúc refresh.
 * Chỉ kiểm tra lúc đăng nhập là chưa đủ: người bị ban vẫn refresh
 * được token cũ và chơi tiếp cả tháng.
 */
export function assertCanLogin(account: Account): void {
  if (account.status === 'deleted') {
    throw Errors.invalidCredentials({ reason: 'account_deleted' })
  }

  if (account.status === 'banned' || account.status === 'suspended') {
    // Khoá có thời hạn đã hết thì cho qua; job nền sẽ dọn trạng thái sau.
    const expired = account.ban_expires_at !== null && account.ban_expires_at.getTime() < Date.now()
    if (!expired) {
      throw Errors.accountBanned(account.ban_reason, account.ban_expires_at)
    }
  }
}

export async function getAccount(id: string): Promise<Account | null> {
  return queryOne<Account>(
    `SELECT id, display_name, status, role, ban_reason, ban_expires_at, created_at, last_login_at
     FROM accounts WHERE id = $1`,
    [id],
  )
}

/**
 * Tìm tài khoản theo Google 'sub', tạo mới nếu chưa có.
 *
 * Toàn bộ nằm trong một transaction để tránh trường hợp hai request
 * đăng nhập song song tạo ra hai tài khoản cho cùng một người.
 * Ràng buộc UNIQUE(provider, provider_user_id) là chốt chặn cuối.
 */
export async function findOrCreateFromGoogle(
  profile: GoogleProfile,
  ctx: { ip?: string | null; userAgent?: string | null },
): Promise<{ account: Account; isNew: boolean }> {
  return withTransaction(async (client: PoolClient) => {
    const existing = await client.query<{ account_id: string }>(
      `SELECT account_id FROM auth_identities
       WHERE provider = 'google' AND provider_user_id = $1`,
      [profile.sub],
    )

    let accountId: string
    let isNew = false

    const found = existing.rows[0]
    if (found) {
      accountId = found.account_id

      // Cập nhật thông tin hồ sơ — người dùng có thể đã đổi tên hoặc email
      // bên Google. Định danh vẫn là 'sub', nên đổi email không ảnh hưởng gì.
      await client.query(
        `UPDATE auth_identities
         SET email = $2, email_verified = $3, picture_url = $4, last_login_at = now()
         WHERE provider = 'google' AND provider_user_id = $1`,
        [profile.sub, profile.email, profile.emailVerified, profile.picture],
      )
    } else {
      const displayName = profile.name?.trim() || profile.email?.split('@')[0] || 'Anh Hùng'

      const created = await client.query<{ id: string }>(
        `INSERT INTO accounts (display_name) VALUES ($1) RETURNING id`,
        [displayName.slice(0, 60)],
      )
      accountId = created.rows[0]!.id
      isNew = true

      await client.query(
        `INSERT INTO auth_identities
           (account_id, provider, provider_user_id, email, email_verified, picture_url, last_login_at)
         VALUES ($1, 'google', $2, $3, $4, $5, now())`,
        [accountId, profile.sub, profile.email, profile.emailVerified, profile.picture],
      )
    }

    await client.query(`UPDATE accounts SET last_login_at = now() WHERE id = $1`, [accountId])

    const account = (
      await client.query<Account>(
        `SELECT id, display_name, status, role, ban_reason, ban_expires_at, created_at, last_login_at
         FROM accounts WHERE id = $1`,
        [accountId],
      )
    ).rows[0]!

    if (isNew) {
      await audit('account.created', {
        accountId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        meta: { provider: 'google' },
      })
    }

    return { account, isNew }
  })
}

/**
 * Xóa tài khoản theo yêu cầu người chơi.
 *
 * Google Play BẮT BUỘC có chức năng này với app cho đăng ký tài khoản.
 * Cách làm: xóa mềm + thu hồi mọi token + gỡ liên kết Google ngay lập tức
 * (để email đó đăng ký lại được), rồi job nền xóa hẳn sau 30 ngày ân hạn.
 */
export async function requestAccountDeletion(accountId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE accounts SET status = 'deleted', deleted_at = now() WHERE id = $1`,
      [accountId],
    )
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = 'account_deleted'
       WHERE account_id = $1 AND revoked_at IS NULL`,
      [accountId],
    )
    await client.query(`DELETE FROM auth_identities WHERE account_id = $1`, [accountId])
  })
}
