import sqlite3 from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import type { DB } from './database/schema.ts'

export interface Context {
	db: Kysely<DB>
}

const db = new Kysely<DB>({
	dialect: new SqliteDialect({
		database: sqlite3(process.env.DATABASE_URL)
	}),
	log: ['query', 'error']
})

const context: Context = {
	db
}

export { context }
