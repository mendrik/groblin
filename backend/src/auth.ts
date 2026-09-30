import { type Account, type BetterAuthOptions, betterAuth } from 'better-auth'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from './database/schema.ts'
import { ProjectService } from './services/project-service.ts'
import { SesClient } from './services/ses-client.ts'

type Auth = ReturnType<typeof betterAuth>

@injectable()
export class Authenticator {
	api: Auth['api']
	handler: Auth['handler']
	constructor(
		@inject(SesClient)
		private sesClient: SesClient,

		@inject(ProjectService)
		private projectService: ProjectService,

		@inject(Kysely) db: Kysely<DB>
	) {
		const email = this.sesClient
		const auth = betterAuth({
			trustedOrigins: (
				process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173'
			).split(','),
			databaseHooks: {
				user: {
					create: {
						before: async user => {
							const mode = process.env.REGISTRATION_MODE ?? 'open'
							if (mode === 'open') return
							if (
								user.email.toLowerCase() ===
								process.env.BOOTSTRAP_EMAIL?.toLowerCase()
							)
								return
							const invitation =
								mode === 'invite'
									? await db
											.selectFrom('project_invitation')
											.select('id')
											.where('email', '=', user.email.toLowerCase())
											.where('expires_at', '>', new Date())
											.where('accepted_at', 'is', null)
											.where('revoked_at', 'is', null)
											.executeTakeFirst()
									: undefined
							return !!invitation
						}
					}
				},
				account: {
					create: {
						after: async (account: Account) => {
							await this.projectService.initializeProject(account.userId)
						}
					}
				}
			},
			database: {
				db,
				type: 'postgres'
			},
			emailAndPassword: {
				enabled: true,
				minPasswordLength: 12,
				revokeSessionsOnPasswordReset: true,
				sendResetPassword: ({ user, url }) =>
					email.sendEmail({
						template: { kind: 'reset', url },
						to: user.email,
						subject: 'Reset your password'
					})
			},
			rateLimit: { enabled: true, window: 60, max: 60 },
			emailVerification: {
				sendOnSignUp: true,
				sendVerificationEmail: options =>
					email.sendEmail({
						template: {
							kind: 'verify',
							name: options.user.name,
							url: options.url
						},
						to: options.user.email,
						subject: 'Verify your email'
					})
			}
		} satisfies BetterAuthOptions)

		this.api = auth.api
		this.handler = auth.handler
	}
}
