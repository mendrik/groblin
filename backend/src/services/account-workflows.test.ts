import { Container } from 'inversify'
import { Kysely } from 'kysely'
import { afterEach, expect, test, vi } from 'vitest'
import { db, sendEmail } from '../../tests/resolver-context.ts'
import { Authenticator } from '../auth.ts'
import type { DB } from '../database/schema.ts'
import { ProjectService } from './project-service.ts'
import { SesClient } from './ses-client.ts'

afterEach(() => vi.unstubAllEnvs())

test('profile and password changes use an authenticated session; verification marks the current account email verified', async () => {
	vi.stubEnv(
		'BETTER_AUTH_SECRET',
		'synthetic-auth-test-secret-with-32-characters'
	)
	vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:5173')
	const container = new Container()
	container.bind(Kysely<DB>).toConstantValue(db)
	container.bind(ProjectService).toSelf()
	container
		.bind(SesClient)
		.toConstantValue({ sendEmail } as unknown as SesClient)
	container.bind(Authenticator).toSelf()
	const auth = container.get(Authenticator)
	const credentials = {
		email: 'account@example.invalid',
		password: 'strong original password'
	}
	const account = await auth.api.signUpEmail({
		body: { ...credentials, name: 'Original' }
	})
	const login = await auth.api.signInEmail({
		body: credentials,
		returnHeaders: true
	})
	const cookie = login.headers
		.getSetCookie()
		.map(cookie => cookie.split(';')[0])
		.join('; ')
	const headers = new Headers({ cookie })
	await auth.api.updateUser({ body: { name: 'Updated name' }, headers })
	expect(
		(
			await db
				.selectFrom('user')
				.select('name')
				.where('id', '=', account.user.id)
				.executeTakeFirst()
		)?.name
	).toBe('Updated name')
	await expect(
		auth.api.updateUser({ body: { name: 'Unauthorized' } })
	).rejects.toThrow()
	await auth.api.signInEmail({ body: credentials })
	await expect(
		auth.api.changePassword({
			body: {
				currentPassword: 'wrong password',
				newPassword: 'a changed password',
				revokeOtherSessions: true
			},
			headers
		})
	).rejects.toThrow()
	await auth.api.changePassword({
		body: {
			currentPassword: credentials.password,
			newPassword: 'a changed password',
			revokeOtherSessions: true
		},
		headers
	})
	expect(
		await db
			.selectFrom('session')
			.select('id')
			.where('userId', '=', account.user.id)
			.execute()
	).toHaveLength(1)
	await expect(auth.api.signInEmail({ body: credentials })).rejects.toThrow()
	await expect(
		auth.api.signInEmail({
			body: { ...credentials, password: 'a changed password' }
		})
	).resolves.toBeDefined()
	const message = sendEmail.mock.calls.find(
		([message]) => message.template.kind === 'verify'
	)?.[0]
	if (!message) throw new Error('Verification email missing')
	await auth.handler(new Request(message.template.url))
	expect(
		(
			await db
				.selectFrom('user')
				.select('emailVerified')
				.where('id', '=', account.user.id)
				.executeTakeFirst()
		)?.emailVerified
	).toBe(true)
	expect(
		await db
			.selectFrom('project_user')
			.select('project_id')
			.where('user_id', '=', account.user.id)
			.execute()
	).toHaveLength(1)
}, 15000)
