import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { config } from './config'
import { logger } from './util/logger'

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  // Lỗi trên connection đang nằm idle trong pool. Không được để nó
  // làm sập tiến trình — pg sẽ tự thay connection mới.
  logger.error({ err }, 'Lỗi PostgreSQL pool')
})

/** Truy vấn tham số hoá. Luôn dùng $1, $2... — không bao giờ nối chuỗi SQL. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query<T>(text, params as never[])
  return res.rows
}

/** Trả về dòng đầu tiên, hoặc null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/**
 * Chạy nhiều lệnh trong một transaction.
 * Tự ROLLBACK nếu callback ném lỗi — quan trọng với thao tác tạo tài khoản
 * và xoay refresh token, nơi làm nửa chừng sẽ để lại dữ liệu hỏng.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function closePool(): Promise<void> {
  await pool.end()
}
