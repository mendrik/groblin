import { type Account, type BetterAuthOptions, betterAuth } from 'better-auth'
import { inject, injectable } from 'inversify'
import { PostgresDialect } from 'kysely'
import pg from 'pg'
import { ProjectService } from './services/project-service.ts'
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
	api: Auth['api']
	handler: Auth['handler']
	constructor(
		@inject(SesClient)
		private sesClient: SesClient,

		@inject(ProjectService)
		private projectService: ProjectService
	) {
		const email = this.sesClient
		const auth = betterAuth({
			trustedOrigins: ['http://localhost:5173', 'https://groblin.org'],
			databaseHooks: {
				account: {
					create: {
						after: async (account: Account) => {
							await projectService.initializeProject(account.userId)
						}
					}
				}
			},
			database: {
				dialect,
				type: 'postgres'
			},
			emailAndPassword: {
				enabled: true
			},
			emailVerification: {
				sendOnSignUp: true,
				sendVerificationEmail: options =>
					email.sendEmail({
						file: 'confirmAccount.json',
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
