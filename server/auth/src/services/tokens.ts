import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import { config } from '../config'
import { pool, withTransaction } from '../db'
import { randomToken, sha256 } from '../util/crypto'
import { Errors } from '../util/errors'
import { logger } from '../util/logger'
import { audit } from './audit'
import { assertCanLogin, getAccount, type Account } from './accounts'

/**
 * ==========================================================
 *  ACCESS TOKEN  (JWT, sống ngắn)
 * ==========================================================
 * Không tra database khi kiểm tra — server game realtime chỉ cần
 * JWT_SECRET là xác thực được, không phải gọi sang auth service mỗi lần.
 *
 * Đổi lại: token bị lộ vẫn dùng được cho tới khi hết hạn. Vì vậy TTL
 * để rất ngắn (15 phút). Muốn cấm ai đó ngay lập tức thì thu hồi
 * refresh token — sau tối đa 15 phút họ sẽ văng ra.
 */

export interface AccessTokenClaims {
  sub: string // account id
  sid: string // family id — cho phép truy vết và thu hồi cả phiên
  role: 'player' | 'gm' | 'admin' | 'developer'
  jti: string
}

export function signAccessToken(accountId: string, familyId: string, role: string = 'player'): string {
  return jwt.sign(
    { sid: familyId, role, jti: randomUUID() },
    config.JWT_SECRET,
    {
      subject: accountId,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      expiresIn: config.ACCESS_TOKEN_TTL_SEC,
      algorithm: 'HS256',
    },
  )
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      // Khoá cứng thuật toán. Nếu không, kẻ tấn công có thể gửi token
      // với alg="none" hoặc đổi sang thuật toán yếu hơn.
      algorithms: ['HS256'],
    }) as jwt.JwtPayload

    if (!payload.sub || typeof payload.sid !== 'string') {
      throw Errors.invalidCredentials({ reason: 'malformed_claims' })
    }

    return {
      sub: payload.sub,
      sid: payload.sid,
      role: (payload.role as any) || 'player',
      jti: String(payload.jti ?? ''),
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw Errors.tokenExpired()
    throw Errors.invalidCredentials({ reason: 'jwt_verify_failed' })
  }
}

/**
 * ==========================================================
 *  REFRESH TOKEN  (chuỗi ngẫu nhiên, sống dài, xoay vòng)
 * ==========================================================
 * Lưu trong database dưới dạng SHA-256. Bản thô chỉ tồn tại đúng một lần
 * trong response trả về game. Database bị lộ cũng không đăng nhập được.
 */

async function insertRefreshToken(
  client: PoolClient,
  opts: {
    accountId: string
    familyId: string
    ip?: string | null
    userAgent?: string | null
    replacesId?: string | null
  },
): Promise<string> {
  const raw = randomToken(32)
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_SEC * 1000)

  const inserted = await client.query<{ id: string }>(
    `INSERT INTO refresh_tokens (account_id, family_id, token_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      opts.accountId,
      opts.familyId,
      sha256(raw),
      expiresAt,
      opts.ip ?? null,
      opts.userAgent?.slice(0, 500) ?? null,
    ],
  )

  if (opts.replacesId) {
    await client.query(`UPDATE refresh_tokens SET replaced_by = $2 WHERE id = $1`, [
      opts.replacesId,
      inserted.rows[0]!.id,
    ])
  }

  return raw
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** Cấp cặp token mới cho một lần đăng nhập mới (family mới). */
export async function issueNewSession(
  accountId: string,
  ctx: { ip?: string | null; userAgent?: string | null },
): Promise<TokenPair> {
  const familyId = randomUUID()

  const account = await getAccount(accountId)
  const role = account?.role || 'player'

  const refreshToken = await withTransaction((client) =>
    insertRefreshToken(client, { accountId, familyId, ip: ctx.ip, userAgent: ctx.userAgent }),
  )

  return {
    accessToken: signAccessToken(accountId, familyId, role),
    refreshToken,
    expiresIn: config.ACCESS_TOKEN_TTL_SEC,
  }
}

/** Thu hồi toàn bộ token của một family (một lần đăng nhập). */
export async function revokeFamily(familyId: string, reason: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = $2
     WHERE family_id = $1 AND revoked_at IS NULL`,
    [familyId, reason],
  )
}

interface RefreshRow {
  id: string
  account_id: string
  family_id: string
  expires_at: Date
  revoked_at: Date | null
}

/**
 * Xoay refresh token.
 *
 * Đây là phần bảo mật tinh tế nhất của cả service. Đọc kỹ trước khi sửa.
 *
 * Kịch bản bị đánh cắp:
 *   1. Kẻ xấu lấy được refresh token R1 từ máy người chơi.
 *   2. Kẻ xấu dùng R1 -> nhận R2. R1 bị đánh dấu thu hồi.
 *   3. Người chơi thật mở game, vẫn đang giữ R1, dùng R1.
 *   4. Server thấy R1 ĐÃ bị thu hồi => chắc chắn có hai bên cùng giữ token.
 *   5. Thu hồi TOÀN BỘ family. Cả hai văng ra. Người chơi thật đăng nhập lại
 *      bằng Google (kẻ xấu không làm được vì không có tài khoản Google).
 *
 * Không có bước 4–5 thì kẻ xấu giữ được quyền truy cập vô thời hạn.
 */
export async function rotateRefreshToken(
  rawToken: string,
  ctx: { ip?: string | null; userAgent?: string | null },
): Promise<TokenPair> {
  const tokenHash = sha256(rawToken)

  return withTransaction(async (client) => {
    // FOR UPDATE khoá dòng lại: hai request refresh chạy song song
    // (rất hay xảy ra khi game vừa mở lại) sẽ bị tuần tự hoá,
    // tránh cảnh cả hai cùng xoay và tự kích hoạt báo động trộm.
    const found = await client.query<RefreshRow>(
      `SELECT id, account_id, family_id, expires_at, revoked_at
       FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash],
    )

    const row = found.rows[0]
    if (!row) {
      throw Errors.invalidCredentials({ reason: 'refresh_not_found' })
    }

    // ---- Phát hiện tái sử dụng ----
    if (row.revoked_at !== null) {
      await client.query(
        `UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = 'reuse_detected'
         WHERE family_id = $1 AND revoked_at IS NULL`,
        [row.family_id],
      )

      logger.warn(
        { accountId: row.account_id, familyId: row.family_id, ip: ctx.ip },
        'PHÁT HIỆN TÁI SỬ DỤNG REFRESH TOKEN — đã thu hồi toàn bộ family',
      )

      await audit('token.reuse_detected', {
        accountId: row.account_id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        meta: { familyId: row.family_id },
      })

      throw Errors.tokenReused({ familyId: row.family_id })
    }

    if (row.expires_at.getTime() < Date.now()) {
      throw Errors.tokenExpired()
    }

    // Kiểm tra ban ở đây, không chỉ lúc đăng nhập.
    const accountRes = await client.query<Account>(
      `SELECT id, display_name, status, role, ban_reason, ban_expires_at, created_at, last_login_at
       FROM accounts WHERE id = $1`,
      [row.account_id],
    )
    const account = accountRes.rows[0]
    if (!account) throw Errors.invalidCredentials({ reason: 'account_missing' })
    assertCanLogin(account)

    // Thu hồi cái cũ, cấp cái mới trong cùng family.
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = 'rotated' WHERE id = $1`,
      [row.id],
    )

    const newRaw = await insertRefreshToken(client, {
      accountId: row.account_id,
      familyId: row.family_id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      replacesId: row.id,
    })

    return {
      accessToken: signAccessToken(row.account_id, row.family_id, account.role || 'player'),
      refreshToken: newRaw,
      expiresIn: config.ACCESS_TOKEN_TTL_SEC,
    }
  })
}

/** Đăng xuất: thu hồi cả family chứa token này. */
export async function revokeByRefreshToken(rawToken: string): Promise<string | null> {
  const row = await pool.query<{ account_id: string; family_id: string }>(
    `SELECT account_id, family_id FROM refresh_tokens WHERE token_hash = $1`,
    [sha256(rawToken)],
  )

  const found = row.rows[0]
  if (!found) return null

  await revokeFamily(found.family_id, 'logout')
  return found.account_id
}

/** Dọn token và phiên đăng nhập đã hết hạn. Gọi định kỳ. */
export async function cleanupExpired(): Promise<void> {
  await pool.query(`DELETE FROM login_sessions WHERE expires_at < now() - interval '1 day'`)
  await pool.query(`DELETE FROM refresh_tokens WHERE expires_at < now() - interval '30 days'`)
}
