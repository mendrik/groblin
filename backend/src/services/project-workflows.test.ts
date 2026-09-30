import { graphql, parse, subscribe } from 'graphql'
import { Container } from 'inversify'
import { afterEach, expect, test, vi } from 'vitest'
import {
	container,
	ctx,
	db,
	pubSub,
	schema,
	sendEmail
} from '../../tests/resolver-context.ts'
import { ProjectResolver } from '../resolvers/project-resolver.ts'
import { UserResolver } from '../resolvers/user-resolver.ts'
import {
	authenticateSession,
	authorizeProject
} from '../security/project-access.ts'
import { type Context, Role, Topic } from '../types.ts'
import { MediaCleanup } from './media-cleanup.ts'
import { ProjectService } from './project-service.ts'
import { S3Client } from './s3-client.ts'

const execute = (source: string, context = ctx) =>
	graphql({ schema, source, contextValue: context })
const tokenOf = (url: string) => new URL(url).pathname.split('/').pop() ?? ''
async function account(id: string, verified = true): Promise<Context> {
	const user = {
		...ctx.user,
		id,
		name: id,
		email: `${id}@example.invalid`,
		emailVerified: verified
	}
	await db.insertInto('user').values(user).execute()
	await db
		.insertInto('session')
		.values({
			id,
			token: id,
			userId: id,
			expiresAt: new Date(Date.now() + 86400000),
			createdAt: new Date(),
			updatedAt: new Date()
		})
		.execute()
	const context: Context = {
		...ctx,
		user,
		session_id: id,
		project_id: 0,
		authenticate: () => authenticateSession(db, context),
		authorize: roles => authorizeProject(db, context, roles)
	}
	return context
}
const members = () => container.get(UserResolver)
const projects = () => container.get(ProjectResolver)
const invite = (email: string, role = Role.Editor) =>
	members().inviteUser(ctx, { email, role })

afterEach(() => {
	vi.unstubAllEnvs()
	vi.restoreAllMocks()
})

test('authenticated users without projects can create one; initial provisioning is idempotent', async () => {
	const empty = await account('empty')
	expect(await projects().getWorkspace(empty)).toEqual({
		projects: [],
		currentProject: null
	})
	expect(
		(
			await execute(
				'{ getWorkspace { projects { id } currentProject { id } } }',
				empty
			)
		).errors
	).toBeUndefined()
	expect(
		(await execute('{ getProject { project { id } } }', empty)).errors?.[0]
			.extensions.code
	).toBe('FORBIDDEN')
	const id = await projects().createProject('  Example  ', empty)
	expect(await container.get(ProjectService).initializeProject('empty')).toBe(
		id
	)
	expect(await container.get(ProjectService).initializeProject('empty')).toBe(
		id
	)
	expect(await container.get(ProjectService).getProjects('empty')).toEqual([
		{ id, name: 'Example', version: 0, role: Role.Owner }
	])
	expect(
		await db
			.selectFrom('node')
			.select('type')
			.where('project_id', '=', id)
			.execute()
	).toEqual([{ type: 'Root' }])
	expect(
		await db
			.selectFrom('content_revision')
			.select('version')
			.where('project_id', '=', id)
			.execute()
	).toEqual([{ version: 0 }])
	await expect(projects().createProject(' ', empty)).rejects.toThrow()
})

test('switching requires confirmed membership and preserves an in-flight project context', async () => {
	await expect(projects().switchProject(2, ctx)).rejects.toThrow(
		'Project not found'
	)
	const id = await projects().createProject('Second project', ctx)
	await projects().switchProject(1, ctx)
	expect(
		(await db.selectFrom('history').selectAll().executeTakeFirst())
			?.current_project_id
	).toBe(1)
	expect(ctx.project_id).toBe(1)
	await projects().switchProject(id, ctx)
	expect(ctx.project_id).toBe(1)
	expect((await projects().getProject(ctx)).project.id).toBe(1)
})

test('invitations work for unregistered emails, store only a token hash and do not grant membership before acceptance', async () => {
	vi.stubEnv('EMAIL', '')
	vi.stubEnv('APP_URL', 'https://cms.example.invalid')
	const created = await invite(' NEW@example.invalid ')
	expect(created.url).toMatch(/^https:\/\/cms.example.invalid\/invite\/gri_/)
	expect(created.emailSent).toBe(false)
	expect(sendEmail).not.toHaveBeenCalled()
	const token = tokenOf(created.url)
	const stored = await db
		.selectFrom('project_invitation')
		.selectAll()
		.executeTakeFirstOrThrow()
	expect(stored.email).toBe('new@example.invalid')
	expect(stored.token_hash).toMatch(/^[0-9a-f]{64}$/)
	expect(JSON.stringify(stored)).not.toContain(token)
	expect(await members().getInvitation(token)).toMatchObject({
		project_name: 'One',
		role: Role.Editor,
		accepted: false
	})
	const recipient = await account('new')
	expect(await projects().getWorkspace(recipient)).toMatchObject({
		projects: []
	})
	expect(await members().acceptInvitation(token, recipient)).toBe(1)
	expect(await members().acceptInvitation(token, recipient)).toBe(1)
	expect(
		await db
			.selectFrom('project_user')
			.select(['roles', 'confirmed', 'owner'])
			.where('user_id', '=', 'new')
			.execute()
	).toEqual([{ roles: [Role.Editor], confirmed: true, owner: false }])
	expect((await members().getInvitation(token)).accepted).toBe(true)
})

test('acceptance checks the current verified email and does not revive removed memberships', async () => {
	const recipient = await account('recipient', false)
	const outsider = await account('outsider')
	const token = tokenOf((await invite(recipient.user.email)).url)
	await expect(
		members().acceptInvitation(token, outsider)
	).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } })
	await expect(
		members().acceptInvitation(token, recipient)
	).rejects.toMatchObject({ extensions: { code: 'EMAIL_NOT_VERIFIED' } })
	await db
		.updateTable('user')
		.set({ emailVerified: true })
		.where('id', '=', recipient.user.id)
		.execute()
	await members().acceptInvitation(token, recipient)
	await members().deleteUser(ctx, recipient.user.id)
	await expect(
		members().acceptInvitation(token, recipient)
	).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } })
})

test('reissued, revoked and expired invitations cannot be accepted; revocation is project scoped', async () => {
	const recipient = await account('recipient')
	const first = await invite(recipient.user.email)
	const next = await invite(recipient.user.email, Role.Viewer)
	await expect(
		members().acceptInvitation(tokenOf(first.url), recipient)
	).rejects.toThrow('unavailable')
	await expect(
		members().revokeInvitation({ ...ctx, project_id: 2 }, next.invitation.id)
	).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } })
	await members().revokeInvitation(ctx, next.invitation.id)
	await expect(members().getInvitation(tokenOf(next.url))).rejects.toThrow(
		'unavailable'
	)
	const expired = await invite(recipient.user.email)
	await db
		.updateTable('project_invitation')
		.set({ expires_at: new Date(0) })
		.where('id', '=', expired.invitation.id)
		.execute()
	await expect(
		members().acceptInvitation(tokenOf(expired.url), recipient)
	).rejects.toThrow('unavailable')
	await expect(members().getInvitation('invalid')).rejects.toThrow(
		'unavailable'
	)
})

test('email delivery failure preserves a usable invitation and returns a copyable link', async () => {
	vi.stubEnv('EMAIL', 'sender@example.invalid')
	sendEmail.mockRejectedValueOnce(new Error('Sensitive provider details'))
	const created = await invite('later@example.invalid')
	expect(created.emailSent).toBe(false)
	expect(created.emailError).toContain('Copy')
	expect(created.emailError).not.toContain('Sensitive')
	expect(await members().getInvitation(tokenOf(created.url))).toMatchObject({
		email: 'later@example.invalid'
	})
	expect((await invite('another@example.invalid')).emailSent).toBe(true)
	expect(sendEmail).toHaveBeenCalledWith(
		expect.objectContaining({
			template: expect.objectContaining({ kind: 'invite' })
		})
	)
})

test('Owner cannot be removed or reassigned through role editing; ownership transfer is atomic', async () => {
	const recipient = await account('recipient')
	await members().acceptInvitation(
		tokenOf((await invite(recipient.user.email)).url),
		recipient
	)
	await expect(members().deleteUser(ctx, ctx.user.id)).rejects.toThrow(
		'Transfer ownership'
	)
	await expect(
		members().updateUserRole(ctx, ctx.user.id, Role.Viewer, Role.Owner)
	).rejects.toThrow('ownership transfer')
	await expect(
		members().updateUserRole(ctx, recipient.user.id, Role.Owner, Role.Editor)
	).rejects.toThrow()
	await members().updateUserRole(
		ctx,
		recipient.user.id,
		Role.Admin,
		Role.Editor
	)
	await expect(
		members().updateUserRole(ctx, recipient.user.id, Role.Viewer, Role.Editor)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	await expect(
		projects().transferProjectOwnership('absent', ctx)
	).rejects.toThrow('confirmed')
	await projects().transferProjectOwnership(recipient.user.id, ctx)
	expect(
		await db
			.selectFrom('project_user')
			.select(['user_id', 'owner', 'roles'])
			.where('project_id', '=', 1)
			.orderBy('user_id')
			.execute()
	).toEqual([
		{ user_id: 'recipient', owner: true, roles: [Role.Owner] },
		{ user_id: 'user', owner: false, roles: [Role.Admin] }
	])
	await expect(
		projects().transferProjectOwnership(ctx.user.id, ctx)
	).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } })
})

test('Editor may edit content and lists but cannot change structure, members, keys or project lifecycle; Viewer is read only', async () => {
	await db
		.updateTable('project_user')
		.set({ owner: false, roles: [Role.Editor] })
		.where('project_id', '=', 1)
		.execute()
	expect(
		(
			await execute(
				'mutation { upsertValue(data: { node_id: 11, expectedRevision: 0, value: { content: "Editor" } }) { revision } }'
			)
		).errors
	).toBeUndefined()
	for (const source of [
		'mutation { insertNode(data: { name: "Test", type: string, parent_id: 10, order: 1 }) { id } }',
		'mutation { upsertNodeSettings(data: { node_id: 11, expectedRevision: 0, settings: {} }) { id } }',
		'{ getUsers { id } }',
		'{ getInvitations { id } }',
		'{ getApiKeys { key } }',
		'mutation { renameProject(name: "Changed", expectedVersion: 1) }',
		'mutation { deleteProject(expectedVersion: 1, confirmation: "One") }'
	])
		expect((await execute(source)).errors?.[0].extensions.code).toBe(
			'FORBIDDEN'
		)
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Viewer] })
		.where('project_id', '=', 1)
		.execute()
	expect(
		(await execute('{ getProject { project { name } } }')).errors
	).toBeUndefined()
	expect(
		(
			await execute(
				'mutation { upsertValue(data: { node_id: 11, expectedRevision: 1, value: { content: "Viewer" } }) { id } }'
			)
		).errors?.[0].extensions.code
	).toBe('FORBIDDEN')
})

test('privileged subscriptions recheck the required role on every event after demotion', async () => {
	const authorize = vi.fn(ctx.authorize)
	const result = await subscribe({
		schema,
		document: parse('subscription { usersUpdated }'),
		contextValue: { ...ctx, authorize }
	})
	if (!('next' in result)) throw new Error('Subscription failed')
	try {
		const next = result.next()
		await db
			.updateTable('project_user')
			.set({ owner: false, roles: [Role.Viewer] })
			.where('project_id', '=', 1)
			.execute()
		pubSub.publish(Topic.UsersUpdated, 1)
		await expect
			.poll(() => authorize.mock.settledResults)
			.toContainEqual({ type: 'fulfilled', value: false })
		await db
			.updateTable('project_user')
			.set({ roles: [Role.Admin] })
			.where('project_id', '=', 1)
			.execute()
		pubSub.publish(Topic.UsersUpdated, 1)
		expect(await next).toMatchObject({
			value: { data: { usersUpdated: true } }
		})
	} finally {
		await result.return?.()
	}
})

test('project rename is versioned; deletion requires the Owner, current version and typed name and queues durable media cleanup', async () => {
	const version = await projects().renameProject('New name', 0, ctx)
	expect(version).toBeGreaterThan(0)
	await expect(projects().renameProject('Stale', 0, ctx)).rejects.toMatchObject(
		{ extensions: { code: 'CONFLICT' } }
	)
	await expect(projects().deleteProject(version, 'Wrong', ctx)).rejects.toThrow(
		'project name'
	)
	await expect(
		projects().deleteProject(0, 'New name', ctx)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	await projects().deleteProject(version, 'New name', ctx)
	expect(
		await db.selectFrom('project').select('id').orderBy('id').execute()
	).toEqual([{ id: 2 }])
	expect(
		await db
			.selectFrom('project_user')
			.selectAll()
			.where('project_id', '=', 1)
			.execute()
	).toEqual([])
	expect(
		await db
			.selectFrom('content_revision')
			.selectAll()
			.where('project_id', '=', 1)
			.execute()
	).toEqual([])
	expect(
		await db
			.selectFrom('media_cleanup_job')
			.select(['prefix', 'attempts'])
			.execute()
	).toEqual([{ prefix: 'project_1/', attempts: 0 }])
})

test('media cleanup retries storage failures, survives restart and refuses to delete a live project', async () => {
	const deleteProjectPrefix = vi
		.fn()
		.mockRejectedValueOnce(new Error('Unavailable'))
		.mockResolvedValue(undefined)
	const child = new Container({ parent: container })
	child
		.bind(S3Client)
		.toConstantValue({ deleteProjectPrefix } as unknown as S3Client)
	child.bind(MediaCleanup).toSelf()
	await projects().deleteProject(0, 'One', ctx)
	await child.get(MediaCleanup).processPending()
	expect(
		await db
			.selectFrom('media_cleanup_job')
			.select(['prefix', 'attempts', 'last_error'])
			.execute()
	).toEqual([{ prefix: 'project_1/', attempts: 1, last_error: 'Unavailable' }])
	await db
		.updateTable('media_cleanup_job')
		.set({ not_before: new Date(0) })
		.execute()
	await child.get(MediaCleanup).processPending()
	expect(
		await db.selectFrom('media_cleanup_job').selectAll().execute()
	).toEqual([])
	await db
		.insertInto('media_cleanup_job')
		.values({ prefix: 'project_2/' })
		.execute()
	await child.get(MediaCleanup).processPending()
	expect(deleteProjectPrefix).toHaveBeenCalledTimes(2)
	expect(
		(
			await db
				.selectFrom('media_cleanup_job')
				.select('last_error')
				.executeTakeFirst()
		)?.last_error
	).toContain('still exists')
})
