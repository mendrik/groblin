import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'
import { Container } from 'inversify'
import { expect, test, vi } from 'vitest'
import { container, ctx, db } from '../../tests/resolver-context.ts'
import { Authenticator } from '../auth.ts'
import { Role } from '../types.ts'
import { onConnect } from './on-connect.ts'

async function setup() {
	await db
		.insertInto('history')
		.values({ user_id: ctx.user.id, current_project_id: 1 })
		.onConflict(c => c.column('user_id').doUpdateSet({ current_project_id: 1 }))
		.execute()
	const getSession = vi
		.fn()
		.mockResolvedValue({ user: ctx.user, session: { id: ctx.session_id } })
	const child = new Container({ parent: container })
	child
		.bind(Authenticator)
		.toConstantValue({ api: { getSession } } as unknown as Authenticator)
	const request = new IncomingMessage(new Socket())
	request.rawHeaders = [
		'Cookie',
		'session=synthetic',
		'Origin',
		'https://cms.example.invalid'
	]
	// Only extra is used by the hook; graphql-ws owns the remaining transport fields.
	const connection = { extra: { request } } as Parameters<
		ReturnType<typeof onConnect>
	>[0]
	return { connect: onConnect(child), connection, getSession }
}

test('loads roles from project membership and bypasses the session cookie cache', async () => {
	const { connect, connection, getSession } = await setup()
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Viewer], owner: false })
		.where('project_id', '=', 1)
		.execute()
	await connect(connection)
	expect(connection.extra).toMatchObject({
		project_id: 1,
		session_id: ctx.session_id,
		roles: [Role.Viewer],
		user: ctx.user
	})
	const [options] = getSession.mock.calls[0]
	expect(options.query).toEqual({ disableCookieCache: true })
	expect(options.headers.get('cookie')).toBe('session=synthetic')
	expect(await connection.extra.authorize?.([Role.Viewer])).toBe(true)
	expect(await connection.extra.authorize?.([Role.Admin])).toBe(false)
})

test('rejects unauthenticated connections before assigning a project', async () => {
	const { connect, connection, getSession } = await setup()
	getSession.mockResolvedValue(null)
	await expect(connect(connection)).rejects.toThrow('Unauthorized')
	expect(connection.extra.project_id).toBeUndefined()
})

test('a remembered project is insufficient after membership is removed', async () => {
	const { connect, connection } = await setup()
	await db.deleteFrom('project_user').where('project_id', '=', 1).execute()
	await connect(connection)
	expect(connection.extra.project_id).toBe(0)
	expect(await connection.extra.authenticate?.()).toBe(true)
	expect(await connection.extra.authorize?.([])).toBe(false)
})

test('membership in a different project cannot authorize the remembered project', async () => {
	const { connect, connection } = await setup()
	await db
		.updateTable('history')
		.set({ current_project_id: 2 })
		.where('user_id', '=', ctx.user.id)
		.execute()
	await connect(connection)
	expect(connection.extra.project_id).toBe(1)
})

test('authorization reflects role changes and session revocation on an existing connection', async () => {
	const { connect, connection } = await setup()
	await connect(connection)
	expect(await connection.extra.authorize?.([Role.Admin])).toBe(true)
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Viewer], owner: false })
		.where('project_id', '=', 1)
		.execute()
	expect(await connection.extra.authorize?.([Role.Admin])).toBe(false)
	expect(await connection.extra.authorize?.([Role.Viewer])).toBe(true)
	await db
		.updateTable('session')
		.set({ expiresAt: new Date(0) })
		.where('id', '=', ctx.session_id)
		.execute()
	expect(await connection.extra.authorize?.([])).toBe(false)
})

test('an explicit operation project stays selected when another tab changes remembered history', async () => {
	await db
		.insertInto('project_user')
		.values({
			user_id: ctx.user.id,
			project_id: 2,
			roles: [Role.Editor],
			confirmed: true
		})
		.execute()
	const { connect, connection: second } = await setup()
	await connect(second)
	const child = new Container({ parent: container })
	child.bind(Authenticator).toConstantValue({
		api: {
			getSession: async () => ({
				user: ctx.user,
				session: { id: ctx.session_id }
			})
		}
	} as unknown as Authenticator)
	await db
		.updateTable('history')
		.set({ current_project_id: 2 })
		.where('user_id', '=', ctx.user.id)
		.execute()
	await onConnect(child, 1)(second)
	expect(second.extra.project_id).toBe(1)
	expect(await second.extra.authorize?.([Role.Admin])).toBe(true)
	await onConnect(child, 2)(second)
	expect(second.extra.project_id).toBe(2)
	expect(await second.extra.authorize?.([Role.Admin])).toBe(false)
	expect(await second.extra.authorize?.([Role.Editor])).toBe(true)
})

test('an explicit foreign or removed project never falls back to an authorized project', async () => {
	const { connection } = await setup()
	const child = new Container({ parent: container })
	child.bind(Authenticator).toConstantValue({
		api: {
			getSession: async () => ({
				user: ctx.user,
				session: { id: ctx.session_id }
			})
		}
	} as unknown as Authenticator)
	await onConnect(child, 2)(connection)
	expect(connection.extra.project_id).toBe(2)
	expect(connection.extra.roles).toEqual([])
	expect(await connection.extra.authenticate?.()).toBe(true)
	expect(await connection.extra.authorize?.([])).toBe(false)
	await expect(onConnect(child, '1')(connection)).rejects.toThrow(
		'Invalid project selection'
	)
})
