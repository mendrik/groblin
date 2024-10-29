import { green } from 'ansicolor'
import sqlite3 from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { isNilOrEmpty } from 'ramda-adjunct'
import type { DB } from './database/schema.ts'

export interface Context {
	db: Kysely<DB>
}

const db = new Kysely<DB>({
	dialect: new SqliteDialect({
		database: sqlite3(process.env.DATABASE_URL)
	}),
	log(event): void {
		if (event.level === 'query') {
			const params = event.query.parameters
			const sql = event.query.sql
			isNilOrEmpty(params)
				? console.log(green(sql))
				: console.log(green(sql), params)
		}
	}
})

const context: Context = {
	db
}

export { context }
