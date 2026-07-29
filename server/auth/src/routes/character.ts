import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { pool, queryOne, withTransaction } from '../db'
import { requireAuth } from '../middleware/require_auth'
import { Errors } from '../util/errors'
import { audit } from '../services/audit'

export const characterRouter = Router()

// Tất cả các route nhân vật đều bắt buộc phải có Access Token
characterRouter.use(requireAuth)

// Map vũ khí tân thủ theo Hệ Ngũ Hành
const STARTER_WEAPONS: Record<string, string> = {
  kim: 'sword_kim_01',    // Thanh Long Kiếm (Lôi / Bạo kích)
  moc: 'fan_moc_01',      // Bích Ngọc Quạt (Độc / DoT)
  thuy: 'staff_thuy_01',  // Băng Sương Trượng (Băng / Hồi phục)
  hoa: 'spear_hoa_01',    // Xích Diễm Thương (Bộc phá / Thiêu đốt)
  tho: 'hammer_tho_01',   // Hoàng Long Búa (Phòng thủ / Stun)
}

/**
 * GET /auth/characters
 * Lấy danh sách nhân vật của tài khoản hiện tại
 */
characterRouter.get('/', async (req: Request, res: Response) => {
  const accountId = req.auth!.accountId

  const result = await pool.query(
    `SELECT 
        c.id, c.name, c.element, c.gender, c.hair_style,
        c.level, c.exp, c.hp, c.mp, c.map_id, c.position_x, c.position_y,
        c.created_at, c.updated_at,
        e.weapon_id, e.weapon_enhance,
        e.armor_id, e.armor_enhance,
        e.helmet_id, e.helmet_enhance,
        e.ring_id, e.ring_enhance,
        e.pendant_id, e.pendant_enhance,
        e.shoes_id, e.shoes_enhance
     FROM characters c
     LEFT JOIN character_equipment e ON c.id = e.character_id
     WHERE c.account_id = $1
     ORDER BY c.created_at ASC`,
    [accountId],
  )

  res.json({
    ok: true,
    data: result.rows,
  })
})

const createCharacterSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên nhân vật phải từ 3 ký tự trở lên')
    .max(16, 'Tên nhân vật tối đa 16 ký tự')
    .regex(/^[\p{L}\p{N}_\s-]+$/u, 'Tên nhân vật không được chứa ký tự đặc biệt'),
  element: z.enum(['kim', 'moc', 'thuy', 'hoa', 'tho'], {
    errorMap: () => ({ message: 'Hệ ngũ hành phải là kim, moc, thuy, hoa hoặc tho' }),
  }),
  gender: z.enum(['male', 'female']).default('male'),
  hair_style: z.number().int().min(1).max(4).default(1),
})

/**
 * POST /auth/characters
 * Tạo nhân vật mới
 */
characterRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createCharacterSchema.safeParse(req.body)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Yêu cầu không hợp lệ'
    throw Errors.invalidRequest({ message: firstMsg, issues: parsed.error.issues })
  }

  const { name, element, gender, hair_style } = parsed.data
  const accountId = req.auth!.accountId
  const cleanName = name.trim()

  // 1. Kiểm tra giới hạn số lượng nhân vật trên 1 tài khoản (Tối đa 3)
  const countRes = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM characters WHERE account_id = $1`,
    [accountId],
  )
  if (countRes && parseInt(countRes.count, 10) >= 3) {
    throw Errors.invalidRequest({ message: 'Tài khoản đã đạt giới hạn tối đa 3 nhân vật' })
  }

  // 2. Kiểm tra tên nhân vật đã tồn tại chưa
  const existingName = await queryOne<{ id: string }>(
    `SELECT id FROM characters WHERE LOWER(name) = LOWER($1)`,
    [cleanName],
  )
  if (existingName) {
    throw Errors.invalidRequest({ message: 'Tên nhân vật này đã được người khác sử dụng' })
  }

  // 3. Tiến hành tạo nhân vật + trang bị tân thủ + vật phẩm tân thủ trong 1 Transaction
  const newCharacter = await withTransaction(async (client) => {
    // Tạo dòng nhân vật
    const charRes = await client.query(
      `INSERT INTO characters (account_id, name, element, gender, hair_style)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [accountId, cleanName, element, gender, hair_style],
    )
    const character = charRes.rows[0]

    // Khởi tạo trang bị tân thủ (cấp vũ khí tương ứng với hệ Ngũ Hành)
    const starterWeapon = STARTER_WEAPONS[element] || 'sword_kim_01'
    await client.query(
      `INSERT INTO character_equipment (character_id, weapon_id)
       VALUES ($1, $2)`,
      [character.id, starterWeapon],
    )

    // Khởi tạo túi đồ tân thủ (Bình máu & bình mana nhỏ)
    await client.query(
      `INSERT INTO character_inventory (character_id, slot_index, item_id, quantity)
       VALUES 
         ($1, 0, 'potion_hp_small', 10),
         ($1, 1, 'potion_mp_small', 10)`,
      [character.id],
    )

    return character
  })

  await audit('character.created', {
    accountId,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
    meta: { characterId: newCharacter.id, name: cleanName, element },
  })

  res.json({
    ok: true,
    data: newCharacter,
  })
})

/**
 * DELETE /auth/characters/:id
 * Xóa nhân vật
 */
characterRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const accountId = req.auth!.accountId

  const deleted = await queryOne<{ id: string }>(
    `DELETE FROM characters WHERE id = $1 AND account_id = $2 RETURNING id`,
    [id, accountId],
  )

  if (!deleted) {
    throw Errors.notFound({ message: 'Không tìm thấy nhân vật hoặc bạn không có quyền xóa' })
  }

  res.json({
    ok: true,
    message: 'Đã xóa nhân vật thành công',
  })
})
