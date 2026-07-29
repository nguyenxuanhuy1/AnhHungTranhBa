import { OAuth2Client } from 'google-auth-library'
import { config } from '../config'
import { Errors } from '../util/errors'
import { logger } from '../util/logger'

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

/**
 * Client này giữ CLIENT SECRET nên chỉ được tồn tại phía server.
 * Secret không bao giờ được gửi xuống game.
 */
const oauthClient = new OAuth2Client({
  clientId: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  redirectUri: config.googleRedirectUri,
})

export interface GoogleProfile {
  sub: string // định danh vĩnh viễn — KHÓA chính của chúng ta
  email: string | null
  emailVerified: boolean
  name: string | null
  picture: string | null
}

/**
 * Dựng URL để mở trong trình duyệt hệ thống.
 *
 * Ba tham số bảo mật:
 *   state          — chống CSRF, khớp lại khi Google gọi về
 *   nonce          — chống phát lại ID token, được nhúng vào chính token
 *   code_challenge — PKCE, chống chặn mã uỷ quyền giữa đường
 *
 * Cả ba đều sinh ở server và lưu trong login_sessions.
 */
export function buildAuthorizeUrl(opts: {
  state: string
  nonce: string
  codeChallenge: string
}): string {
  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: opts.state,
    nonce: opts.nonce,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',

    // Chỉ cần biết người này là ai, không cần truy cập dữ liệu Google
    // của họ về sau. Vì vậy KHÔNG xin refresh token của Google —
    // xin ít quyền nhất có thể là nguyên tắc cơ bản.
    access_type: 'online',

    // Luôn cho người chơi chọn tài khoản. Máy dùng chung rất phổ biến
    // ở Việt Nam; tự đăng nhập bằng tài khoản cũ là trải nghiệm tệ.
    prompt: 'select_account',
  })

  return `${AUTH_ENDPOINT}?${params.toString()}`
}

/**
 * Đổi mã uỷ quyền lấy hồ sơ người dùng đã được xác minh.
 *
 * `verifyIdToken` của thư viện chính chủ Google kiểm tra giúp:
 *   - chữ ký, đối chiếu với khoá công khai của Google (có cache sẵn)
 *   - `aud` khớp client ID của chúng ta
 *   - `iss` là accounts.google.com
 *   - `exp` chưa quá hạn
 *
 * Còn `nonce` thì phải TỰ kiểm tra — thư viện không làm việc đó.
 */
export async function exchangeCodeForProfile(opts: {
  code: string
  codeVerifier: string
  expectedNonce: string
}): Promise<GoogleProfile> {
  let idToken: string | null | undefined

  try {
    const { tokens } = await oauthClient.getToken({
      code: opts.code,
      codeVerifier: opts.codeVerifier,
    })
    idToken = tokens.id_token
  } catch (err) {
    logger.warn({ err }, 'Đổi mã uỷ quyền với Google thất bại')
    throw Errors.googleFailed({ stage: 'token_exchange' })
  }

  if (!idToken) {
    throw Errors.googleFailed({ stage: 'missing_id_token' })
  }

  let payload
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch (err) {
    logger.warn({ err }, 'Xác minh ID token thất bại')
    throw Errors.googleFailed({ stage: 'verify_id_token' })
  }

  if (!payload?.sub) {
    throw Errors.googleFailed({ stage: 'empty_payload' })
  }

  // Kiểm tra nonce: nếu không khớp, ID token này thuộc về một yêu cầu khác.
  // Đây chính là lá chắn chống tấn công phát lại (replay).
  if (payload.nonce !== opts.expectedNonce) {
    logger.warn({ sub: payload.sub }, 'Nonce không khớp — có thể là tấn công phát lại')
    throw Errors.googleFailed({ stage: 'nonce_mismatch' })
  }

  return {
    sub: payload.sub,
    email: payload.email?.toLowerCase() ?? null,
    emailVerified: payload.email_verified === true,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
  }
}
