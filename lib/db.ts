import { Pool } from 'pg'

const globalForPg = globalThis as unknown as {
  pool: Pool | undefined
}

export const db =
  globalForPg.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pool = db
}