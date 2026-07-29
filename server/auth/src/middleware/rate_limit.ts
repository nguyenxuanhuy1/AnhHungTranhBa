import rateLimit, { type Options } from 'express-rate-limit'
import type { Request } from 'express'

/**
 * LƯU Ý QUAN TRỌNG VỀ NAT DI ĐỘNG Ở VIỆT NAM
 *
 * Viettel/VNPT/Mobifone gom rất nhiều thuê bao 4G sau cùng một IP công cộng.
 * Giới hạn theo IP mà đặt chặt sẽ chặn oan hàng loạt người chơi thật.
 *
 * Vì vậy:
 *   - Giới hạn theo IP để ở mức RỘNG, chỉ nhằm chặn kịch bản lũ request.
 *   - Endpoint nào có định danh riêng (session_id) thì giới hạn theo
 *     định danh đó — vừa chính xác vừa không bị NAT làm nhiễu.
 */

const common: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'rate_limited',
    message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  },
}

/** Bảo vệ chung cho toàn bộ API. */
export const globalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 600,
})

/** Tạo phiên đăng nhập — mỗi lần tạo là một dòng trong DB nên cần chặn lũ. */
export const createSessionLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 100,
})

/**
 * Hỏi kết quả đăng nhập.
 *
 * Game hỏi lại mỗi ~2.5 giây trong tối đa 5 phút, tức khoảng 120 lần cho
 * một lần đăng nhập. Giới hạn theo IP là sai hoàn toàn ở đây.
 * Giới hạn theo session_id: mỗi phiên có ngân sách riêng.
 */
export const claimLimiter = rateLimit({
  ...common,
  windowMs: 10 * 60 * 1000,
  limit: 200,
  keyGenerator: (req: Request) => {
    const sid = (req.body as { session_id?: unknown } | undefined)?.session_id
    return typeof sid === 'string' && sid.length > 0 ? `sid:${sid}` : `ip:${req.ip}`
  },
})

/** Làm mới token. Bình thường mỗi 15 phút một lần, nên đặt chặt hơn được. */
export const refreshLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 120,
})
