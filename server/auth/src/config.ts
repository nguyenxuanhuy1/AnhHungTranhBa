import 'dotenv/config'
import { z } from 'zod'

/**
 * Đọc và KIỂM TRA biến môi trường ngay lúc khởi động.
 *
 * Chủ ý dừng hẳn tiến trình nếu thiếu cấu hình, thay vì để server chạy được
 * rồi sập giữa chừng lúc có người đăng nhập. Sai cấu hình auth mà phát hiện
 * muộn là kiểu lỗi tệ nhất.
 */

const boolFromEnv = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  PUBLIC_BASE_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: boolFromEnv.default('false'),

  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET phải dài ít nhất 32 ký tự'),
  JWT_ISSUER: z.string().default('anhhung-auth'),
  JWT_AUDIENCE: z.string().default('anhhung-game'),

  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(5_184_000),
  LOGIN_SESSION_TTL_SEC: z.coerce.number().int().positive().default(300),

  TRUST_PROXY: boolFromEnv.default('false'),
  APP_DISPLAY_NAME: z.string().default('Anh Hùng Xưng Bá'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('\n❌ Cấu hình môi trường không hợp lệ:\n')
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error('\n→ Kiểm tra lại file .env (tham khảo .env.example)\n')
  process.exit(1)
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  googleRedirectUri: `${parsed.data.PUBLIC_BASE_URL.replace(/\/+$/, '')}/auth/google/callback`,
} as const

// Chặn một lỗi cấu hình chết người: production mà chạy HTTP.
// OAuth qua HTTP nghĩa là mã uỷ quyền bay qua mạng dạng thô.
if (config.isProd && !config.PUBLIC_BASE_URL.startsWith('https://')) {
  console.error('\n❌ PUBLIC_BASE_URL phải dùng https:// khi NODE_ENV=production\n')
  process.exit(1)
}

// Chặn việc quên đổi secret mẫu.
if (config.isProd && config.JWT_SECRET.includes('thay-bang')) {
  console.error('\n❌ JWT_SECRET vẫn đang là giá trị mẫu. Sinh secret thật trước khi chạy production.\n')
  process.exit(1)
}
