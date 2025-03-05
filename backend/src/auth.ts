import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { inject, injectable } from 'inversify'
import { PostgresDialect } from 'kysely'
import pg from 'pg'
import { SesClient } from './services/ses-client.ts'

const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10
	})
})

type Auth = ReturnType<typeof betterAuth>

@injectable()
export class Authenticator {
	@inject(SesClient)
	private sesClient: SesClient

	api: Auth['api']
	handler: Auth['handler']
	constructor() {
		const email = this.sesClient
		const auth = betterAuth({
			database: {
				dialect,
				type: 'postgres'
			},
			emailAndPassword: {
				enabled: true
			},
			emailVerification: {
				sendOnSignUp: true,
				sendVerificationEmail: async options =>
					email.sendEmail({
						file: './emails/confirmAccount.json',
						to: options.user.email,
						subject: 'Verify your email',
						options
					})
			}
		} satisfies BetterAuthOptions)

		this.api = auth.api
		this.handler = auth.handler
	}
}
