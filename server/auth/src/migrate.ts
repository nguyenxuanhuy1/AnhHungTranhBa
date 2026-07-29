import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pool, withTransaction, closePool } from './db'
import { logger } from './util/logger'

/**
 * Trình chạy migration tối giản.
 *
 * Mỗi file .sql trong migrations/ chạy đúng MỘT lần, theo thứ tự tên file,
 * và mỗi file nằm trong một transaction riêng. Tên file đã chạy được ghi
 * vào bảng schema_migrations.
 *
 * Quy tắc: file đã chạy trên production thì KHÔNG được sửa nữa.
 * Cần đổi gì thì thêm file mới (002_, 003_...).
 */

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations')

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `)
}

async function run(): Promise<void> {
  await ensureMigrationsTable()

  const applied = new Set(
    (await pool.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map((r) => r.name),
  )

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let count = 0
  for (const file of files) {
    if (applied.has(file)) {
      logger.debug(`⏭  bỏ qua ${file} (đã chạy)`)
      continue
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    logger.info(`▶  đang chạy ${file}`)

    await withTransaction(async (client) => {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
    })

    logger.info(`✔  xong ${file}`)
    count++
  }

  logger.info(count === 0 ? 'Database đã ở phiên bản mới nhất.' : `Đã áp dụng ${count} migration.`)
}

run()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch(async (err) => {
    logger.error({ err }, 'Migration thất bại')
    await closePool().catch(() => {})
    process.exit(1)
  })
