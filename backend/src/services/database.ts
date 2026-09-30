import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { DB } from '../database/schema.ts'

const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: process.env.DATABASE_URL,
		max: Number(process.env.DB_POOL_MAX ?? 10),
		statement_timeout: 30000,
		idle_in_transaction_session_timeout: 60000,
		connectionTimeoutMillis: 10000
	})
})

export const db = new Kysely<DB>({ dialect })
