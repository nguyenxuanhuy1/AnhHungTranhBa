/**
 * Lỗi có mã ổn định để client xử lý.
 *
 * Nguyên tắc: thông báo trả về client phải CHUNG CHUNG.
 * Chi tiết thật (token nào, tài khoản nào) chỉ ghi vào log phía server.
 * Thông báo lỗi quá cụ thể là cách kẻ tấn công dò tìm tài khoản tồn tại.
 */
export class AuthError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly publicMessage: string,
    public readonly logDetail?: Record<string, unknown>,
  ) {
    super(publicMessage)
    this.name = 'AuthError'
  }
}

export const Errors = {
  invalidRequest: (detail?: Record<string, unknown>) =>
    new AuthError('invalid_request', 400, 'Yêu cầu không hợp lệ.', detail),

  sessionNotFound: () =>
    new AuthError('session_not_found', 404, 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.'),

  sessionExpired: () =>
    new AuthError('session_expired', 410, 'Phiên đăng nhập đã hết hạn. Vui lòng thử lại.'),

  invalidCredentials: (detail?: Record<string, unknown>) =>
    new AuthError('invalid_credentials', 401, 'Thông tin xác thực không hợp lệ.', detail),

  tokenExpired: () =>
    new AuthError('token_expired', 401, 'Phiên đã hết hạn. Vui lòng đăng nhập lại.'),

  tokenReused: (detail?: Record<string, unknown>) =>
    new AuthError(
      'token_reused',
      401,
      'Phát hiện bất thường về bảo mật. Vui lòng đăng nhập lại.',
      detail,
    ),

  accountBanned: (reason?: string | null, until?: Date | null) =>
    new AuthError('account_banned', 403, reason ?? 'Tài khoản đã bị khoá.', {
      until: until?.toISOString(),
    }),

  googleFailed: (detail?: Record<string, unknown>) =>
    new AuthError('google_failed', 502, 'Không xác thực được với Google. Vui lòng thử lại.', detail),

  internal: (detail?: Record<string, unknown>) =>
    new AuthError('internal_error', 500, 'Lỗi hệ thống. Vui lòng thử lại sau.', detail),
} as const
