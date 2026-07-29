import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../services/tokens'
import { Errors } from '../util/errors'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { accountId: string; familyId: string }
    }
  }
}

/**
 * Bắt buộc có access token hợp lệ trong header:
 *   Authorization: Bearer <token>
 *
 * Chỉ kiểm tra chữ ký và hạn dùng — KHÔNG tra database.
 * Nhờ vậy server game realtime dùng lại được middleware này
 * mà không tạo thêm tải lên DB auth ở mỗi request.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    next(Errors.invalidCredentials({ reason: 'missing_bearer' }))
    return
  }

  try {
    const claims = verifyAccessToken(header.slice(7).trim())
    req.auth = { accountId: claims.sub, familyId: claims.sid }
    next()
  } catch (err) {
    next(err)
  }
}
