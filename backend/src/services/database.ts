import { darkGray, green, lightGreen, lightRed, red } from 'ansicolor'
import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import { isNilOrEmpty } from 'ramda-adjunct'
import type { DB } from '../database/schema.ts'

const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10
	})
})

export const db = new Kysely<DB>({
	dialect,
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
