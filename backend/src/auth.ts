import { betterAuth } from 'better-auth'
import { injectable } from 'inversify'
import { PostgresDialect } from 'kysely'
import pg from 'pg'

const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10
	})
})

export const auth = betterAuth({
	database: {
		dialect,
		type: 'postgres'
	},
	emailAndPassword: {
		enabled: true
	}
})

@injectable()
export class Authenticator {
	api: typeof auth.api
	handler: typeof auth.handler
	constructor() {
		this.api = auth.api
		this.handler = auth.handler
	}
}
