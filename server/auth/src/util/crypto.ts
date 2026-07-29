import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Chuỗi ngẫu nhiên an toàn mật mã, mã hoá base64url (an toàn khi đặt trong URL). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** SHA-256 trả về Buffer — dùng để lưu vào cột bytea. */
export function sha256(input: string): Buffer {
  return createHash('sha256').update(input, 'utf8').digest()
}

/** SHA-256 dạng hex — khớp với String.sha256_text() bên Godot. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/**
 * So sánh chống tấn công đo thời gian.
 *
 * So sánh bí mật bằng `===` sẽ thoát ra ngay ở byte đầu tiên khác nhau.
 * Chênh lệch thời gian đó đủ để đoán dần từng byte. Với chuỗi so sánh
 * bí mật xác thực, luôn dùng hàm này.
 */
export function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Sinh cặp PKCE (RFC 7636), phương thức S256. */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}
