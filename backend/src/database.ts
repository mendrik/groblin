import { darkGray, green, lightGreen, lightRed, red } from 'ansicolor'
import sqlite3 from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { isNilOrEmpty } from 'ramda-adjunct'
import type { DB } from './database/schema.ts'

export const db = new Kysely<DB>({
	dialect: new SqliteDialect({
		database: sqlite3(process.env.DATABASE_URL)
	}),
	plugins: [],
	log(event): void {
		if (event.level === 'query') {
			const { parameters, sql } = event.query
			isNilOrEmpty(parameters)
				? console.log(green('Sql: ') + lightGreen(sql))
				: console.log(green('Sql: ') + lightGreen(sql), parameters)
		}
		if (event.level === 'error') {
			console.log(red('Err: ') + lightRed(`${event.error}`))
			console.log(darkGray('Sql: ') + darkGray(event.query.sql))
		}
	}
})
