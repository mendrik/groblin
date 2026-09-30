import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import { graphql } from 'graphql'
import { impactToken, rowRevision } from '../../tests/resolver-context.ts'
import { Authenticator } from '../auth.ts'
import { DeletionKind } from '../gql/schema.ts'
import { hashApiKey } from '../security/api-key.ts'
import { projectEventFilter } from '../security/project-access.ts'
import { ImageService } from '../services/image-service.ts'
import { MediaAssets } from '../services/media-assets.ts'
import { PublicServer } from '../services/public-server.ts'
import { S3Client } from '../services/s3-client.ts'
import { SchemaService } from '../services/schema-service.ts'
import { Role } from '../types.ts'
import { ApiKeyResolver } from './api-key-resolver.ts'
import { ListResolver } from './list-resolver.ts'
import { ProjectResolver } from './project-resolver.ts'
import { UserResolver } from './user-resolver.ts'
import 'reflect-metadata'
import { Container } from 'inversify'
import { Kysely, sql } from 'kysely'
import { expect, test, vi } from 'vitest'
import {
	confirmedImport,
	container,
	ctx,
	db,
	deleteFile,
	getContent,
	publish,
	pubSub,
	schema
} from '../../tests/resolver-context.ts'
import type { DB } from '../database/schema.ts'
import { NodeType, Topic } from '../types.ts'
import { NodeResolver } from './node-resolver.ts'
import { NodeSettingsResolver } from './node-settings-resolver.ts'
import { ValueResolver } from './value-resolver.ts'

// Both rejection and a no-op are valid, but no foreign row or cleanup event may change.
const attempt = async (action: Promise<unknown>) => {
	await action.catch(() => undefined)
}
test('cannot delete another project root and its tree', async () => {
	await attempt(
		container.get(NodeResolver).deleteNodeById(20, undefined, 0, ctx, '')
	)
	expect(
		await db
			.selectFrom('node')
			.where('id', '=', 21)
			.select('id')
			.executeTakeFirst()
	).toBeDefined()
})
test('cannot overwrite another project value or publish its media for deletion', async () => {
	await attempt(
		container.get(ValueResolver).upsertValue(
			{
				expectedRevision: await rowRevision('values', 200),
				id: 200,
				node_id: 11,
				list_path: null,
				value: { text: 'attack' }
			},
			ctx
		)
	)
	expect(
		(
			await db
				.selectFrom('values')
				.select('value')
				.where('id', '=', 200)
				.executeTakeFirstOrThrow()
		).value
	).toEqual({ text: 'private' })
	expect(
		publish.mock.calls.filter(([topic]) => topic === Topic.ValueDeleted)
	).toHaveLength(0)
})
test('cannot delete another project list item', async () => {
	await attempt(container.get(ValueResolver).deleteListItem(200, ctx, ''))
	expect(
		await db
			.selectFrom('values')
			.where('id', '=', 200)
			.select('id')
			.executeTakeFirst()
	).toBeDefined()
})
test('cannot trigger media cleanup with an unauthorized delete', async () => {
	await attempt(container.get(ValueResolver).deleteValue(200, ctx, ''))
	expect(
		publish.mock.calls.filter(([topic]) => topic === Topic.ValueDeleted)
	).toHaveLength(0)
})
test('cannot overwrite another project settings', async () => {
	await attempt(
		container.get(NodeSettingsResolver).upsertNodeSettings(
			{
				expectedRevision: await rowRevision('node_settings', 200),
				id: 200,
				node_id: 11,
				settings: {}
			},
			ctx
		)
	)
	expect(
		(
			await db
				.selectFrom('node_settings')
				.where('id', '=', 200)
				.select('settings')
				.executeTakeFirstOrThrow()
		).settings
	).toEqual({ required: true })
})
test('cannot attach a node to another project parent', async () => {
	await expect(
		container
			.get(NodeResolver)
			.insertNode(
				{ name: 'Attack', type: NodeType.string, order: 0, parent_id: 20 },
				undefined,
				ctx
			)
	).rejects.toThrow()
})
test('cannot attach a value to another project node', async () => {
	await expect(
		container
			.get(ValueResolver)
			.upsertValue(
				{ expectedRevision: 0, node_id: 21, list_path: null, value: {} },
				ctx
			)
	).rejects.toThrow()
})
test('cannot attach a value to another project list path', async () => {
	await expect(
		container
			.get(ValueResolver)
			.upsertValue(
				{ expectedRevision: 0, node_id: 11, list_path: [200], value: {} },
				ctx
			)
	).rejects.toThrow()
})
test('can edit own project', async () => {
	const values = container.get(ValueResolver)
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 11,
			list_path: null,
			value: { content: 'hello' }
		},
		ctx
	)
	await values.upsertValue(
		{
			expectedRevision: await rowRevision('values', id),
			id,
			node_id: 11,
			list_path: null,
			value: { content: 'updated' }
		},
		ctx
	)
	expect(
		(
			await db
				.selectFrom('values')
				.where('id', '=', id)
				.select('value')
				.executeTakeFirstOrThrow()
		).value
	).toEqual({ content: 'updated' })
})

const execute = (source: string) =>
	graphql({ schema, source, contextValue: ctx })
test('Viewer can read but cannot mutate through GraphQL', async () => {
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Viewer], owner: false })
		.where('project_id', '=', 1)
		.execute()
	expect((await execute('{ getNodes { id } }')).errors).toBeUndefined()
	for (const mutation of [
		'deleteNodeById(id: 11, parent_id: 10, order: 0, expectedImpact: "")',
		'upsertValue(data: { expectedRevision: 0, node_id: 11, value: { content: "attack" } })',
		'upsertNodeSettings(data: { expectedRevision: 0, node_id: 11, settings: {} })',
		'createApiKey(data: { name: "attack" }) { key }',
		'deleteUser(id: "user")',
		'uploadUrl(filename: "attack") { object }',
		'importArray(data: { node_id: 11, data: "x", structure: true }, expectedVersion: 0, expectedSource: "x")'
	])
		expect(
			(await execute(`mutation { ${mutation} }`)).errors?.length
		).toBeGreaterThan(0)
})
test('removed members and expired sessions cannot read or receive events', async () => {
	expect(
		await projectEventFilter({ payload: { project_id: 1 }, context: ctx })
	).toBe(true)
	expect(
		await projectEventFilter({ payload: { project_id: 2 }, context: ctx })
	).toBe(false)
	await db.deleteFrom('project_user').where('project_id', '=', 1).execute()
	expect(
		(await execute('{ getProject { project { id } } }')).errors?.length
	).toBeGreaterThan(0)
	expect(await projectEventFilter({ payload: 1, context: ctx })).toBe(false)
	await db
		.insertInto('project_user')
		.values({ project_id: 1, user_id: 'user', roles: [Role.Admin] })
		.execute()
	await db
		.updateTable('session')
		.set({ expiresAt: new Date(0) })
		.execute()
	expect((await execute('{ getNodes { id } }')).errors?.length).toBeGreaterThan(
		0
	)
	expect(await projectEventFilter({ payload: 1, context: ctx })).toBe(false)
})
test('database rejects foreign parent and node references', async () => {
	await expect(
		db
			.insertInto('node')
			.values({
				name: 'Foreign',
				type: NodeType.string,
				order: 0,
				parent_id: 20,
				project_id: 1
			})
			.execute()
	).rejects.toThrow()
	await expect(
		db
			.insertInto('values')
			.values({ node_id: 21, project_id: 1, value: {} })
			.execute()
	).rejects.toThrow()
})
test('cannot reparent a node into another project', async () => {
	await expect(
		container.get(NodeResolver).updateNode(
			{
				expectedRevision: await rowRevision('node', 11),
				id: 11,
				parent_id: 20,
				name: 'Attack',
				type: NodeType.string,
				order: 0
			},
			ctx
		)
	).rejects.toThrow()
})
test('cannot store a media key from another project', async () => {
	await expect(
		container.get(ValueResolver).upsertValue(
			{
				expectedRevision: 0,
				node_id: 11,
				list_path: null,
				value: { file: 'project_2/00000000-0000-0000-0000-000000000000' }
			},
			ctx
		)
	).rejects.toThrow()
})
test('import rejects foreign S3 keys before touching storage', async () => {
	await expect(
		confirmedImport(
			{
				node_id: 11,
				data: 'project_2/00000000-0000-0000-0000-000000000000',
				structure: true,
				external_id: undefined,
				list_path: null
			},
			ctx
		)
	).rejects.toThrow()
	expect(getContent).not.toHaveBeenCalled()
	expect(deleteFile).not.toHaveBeenCalled()
})
test('API keys are stored hashed and expiration is enforced even with a cached schema', async () => {
	const key = await container
		.get(ApiKeyResolver)
		.createApiKey(ctx, { name: 'Test key', expires_at: null })
	const stored = await db
		.selectFrom('api_key')
		.selectAll()
		.executeTakeFirstOrThrow()
	expect(stored.key).toBe(hashApiKey(key.key))
	expect(stored.key).not.toBe(key.key)
	await container.get(ProjectResolver).publishContent(0, 0, undefined, ctx)
	const server = container.get(PublicServer)
	await expect(server.schema(key.key)).resolves.toBeDefined()
	await db
		.updateTable('api_key')
		.set({ expires_at: new Date(0) })
		.execute()
	await expect(server.schema(key.key)).rejects.toThrow()
	await expect(server.schema(stored.key)).rejects.toThrow()
})
test('building a second schema preserves the first project context', async () => {
	await db
		.insertInto('values')
		.values({ node_id: 11, project_id: 1, value: { content: 'own data' } })
		.execute()
	const service = container.get(SchemaService)
	const one = await service.getSchema(1)
	await service.getSchema(2)
	const result = await graphql({ schema: one, source: '{ Own }' })
	expect(result.errors).toBeUndefined()
	expect(result.data?.Own).toBe('own data')
})
test('projects support multiple members and removing one does not remove the owner', async () => {
	await db
		.insertInto('user')
		.values({
			...ctx.user,
			id: 'second',
			email: 'second@example.invalid',
			image: null
		})
		.onConflict(c => c.column('id').doNothing())
		.execute()
	await db
		.insertInto('project_user')
		.values({
			project_id: 1,
			user_id: 'second',
			roles: [Role.Editor],
			confirmed: true
		})
		.execute()
	expect(await container.get(UserResolver).getUsers(ctx)).toHaveLength(2)
	await container.get(UserResolver).deleteUser(ctx, 'second')
	expect(await container.get(UserResolver).getUsers(ctx)).toHaveLength(1)
	await expect(
		container.get(UserResolver).deleteUser(ctx, 'user')
	).rejects.toThrow('Transfer ownership')
})

test('password reset sends a real link, changes the password once, and revokes sessions', async () => {
	const { SesClient } = await import('../services/ses-client.ts')
	const { ProjectService } = await import('../services/project-service.ts')
	const sent = vi.fn().mockResolvedValue(undefined)
	const authContainer = new Container()
	authContainer.bind(Kysely<DB>).toConstantValue(db)
	authContainer.bind('PubSub').toConstantValue(pubSub)
	authContainer
		.bind(SesClient)
		.toConstantValue({ sendEmail: sent } as unknown as InstanceType<
			typeof SesClient
		>)
	authContainer.bind(ProjectService).toSelf()
	authContainer.bind(Authenticator).toSelf()
	vi.stubEnv(
		'BETTER_AUTH_SECRET',
		'synthetic-auth-test-secret-with-32-characters'
	)
	vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:5173')
	await sql`SELECT setval('project_id_seq', 100), setval('node_id_seq', 1000)`.execute(
		db
	)
	const auth = authContainer.get(Authenticator)
	const email = 'reset@example.invalid'
	const password = ' password with spaces '
	const registration = await auth.api.signUpEmail({
		body: { name: 'Reset Test', email, password }
	})
	const login = await auth.api.signInEmail({ body: { email, password } })
	expect(login.token).toBeTruthy()
	await expect(
		auth.api.signInEmail({ body: { email, password: password.trim() } })
	).rejects.toThrow()
	await auth.api.requestPasswordReset({
		body: { email, redirectTo: 'http://localhost:5173/reset-password' }
	})
	const message = sent.mock.calls.find(
		([message]) => message.template.kind === 'reset'
	)?.[0]
	expect(message).toBeDefined()
	const token = new URL(message.template.url).pathname.split('/').pop()
	expect(token).toBeTruthy()
	await auth.api.resetPassword({
		body: { token, newPassword: 'changed password' }
	})
	await expect(
		auth.api.resetPassword({ body: { token, newPassword: 'changed again' } })
	).rejects.toThrow()
	await expect(
		auth.api.signInEmail({ body: { email, password } })
	).rejects.toThrow()
	expect(
		await db
			.selectFrom('session')
			.where('userId', '=', registration.user.id)
			.select('id')
			.execute()
	).toHaveLength(0)
	await expect(
		auth.api.signInEmail({ body: { email, password: 'changed password' } })
	).resolves.toBeDefined()
	vi.unstubAllEnvs()
}, 15000)

test('media requires membership or a signed capability and cannot be enumerated', async () => {
	const { createServer } = await import('node:http')
	const { encryptInteger } = await import('@shared/utils/number-hash.ts')
	const { signMedia } = await import('../security/media-token.ts')
	const child = new Container({ parent: container })
	child.bind(ImageService).toSelf()
	child.bind(AwsS3).toConstantValue(
		new AwsS3({
			region: 'eu-north-1',
			credentials: { accessKeyId: 'synthetic', secretAccessKey: 'synthetic' }
		})
	)
	const service = child.get(ImageService)
	await db
		.updateTable('values')
		.where('id', '=', 200)
		.set({
			value: {
				file: 'project_2/00000000-0000-0000-0000-000000000000',
				name: 'private.txt',
				contentType: 'text/plain',
				size: 10
			}
		})
		.execute()
	const row = await db
		.selectFrom('values')
		.where('id', '=', 200)
		.select('updated_at')
		.executeTakeFirstOrThrow()
	vi.stubEnv(
		'MEDIA_SIGNING_SECRET',
		'synthetic-test-secret-with-at-least-32-characters'
	)
	const server = createServer((request, response) => {
		void service.handleRequest(request, response)
	})
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
	const address = server.address()
	if (!address || typeof address === 'string')
		throw new Error('Missing test server address')
	const base = `http://127.0.0.1:${address.port}/media/${encryptInteger(200)}`
	try {
		expect((await fetch(base, { redirect: 'manual' })).status).toBe(403)
		const expires = String(Date.now() + 60000)
		const token = signMedia(200, String(row.updated_at.getTime()), '', expires)
		const signed = await fetch(`${base}?expires=${expires}&token=${token}`, {
			redirect: 'manual'
		})
		expect(signed.status).toBe(302)
		expect(signed.headers.get('location')).toContain('project_2')
		expect(
			(
				await fetch(`${base}?expires=${expires}&token=${token}&size=640`, {
					redirect: 'manual'
				})
			).status
		).toBe(403)
	} finally {
		await new Promise<void>((resolve, reject) =>
			server.close(error => (error ? reject(error) : resolve()))
		)
		vi.unstubAllEnvs()
	}
})

test('initial project read returns only the current project data', async () => {
	const result = await execute(
		'{ getProject { project { id } nodes { id } values { id } nodeSettings { id } } }'
	)
	expect(result.errors).toBeUndefined()
	expect(result.data?.getProject).toEqual({
		project: { id: 1 },
		nodes: [{ id: 10 }, { id: 11 }],
		values: [],
		nodeSettings: []
	})
})

test('own list insertion, nested reads and deletion work with PostgreSQL arrays', async () => {
	await db
		.updateTable('node')
		.where('id', '=', 11)
		.set({ type: NodeType.list })
		.execute()
	await db
		.insertInto('node')
		.values({
			id: 12,
			name: 'Child',
			type: NodeType.string,
			parent_id: 11,
			project_id: 1,
			order: 0
		})
		.execute()
	const resolver = container.get(ValueResolver)
	const id = await resolver.insertListItem(
		{ node_id: 11, name: 'Item', list_path: null },
		ctx
	)
	await resolver.upsertValue(
		{
			expectedRevision: 0,
			node_id: 12,
			value: { content: 'child' },
			list_path: [id]
		},
		ctx
	)
	expect(await resolver.getValues({ ids: [id] }, ctx)).toHaveLength(2)
	expect(
		await container
			.get(ListResolver)
			.getListItems(ctx, { node_id: 11, list_path: null })
	).toHaveLength(1)
	expect(await container.get(ListResolver).getListColumns(ctx, 11)).toEqual([
		expect.objectContaining({ id: 12 })
	])
	expect(
		await resolver.deleteListItem(
			id,
			ctx,
			await impactToken(DeletionKind.Value, id)
		)
	).toBe(true)
	expect(await resolver.getValues({ ids: [] }, ctx)).toHaveLength(0)
})

test('media cleanup continues after a storage error', async () => {
	const first = 'project_2/00000000-0000-0000-0000-000000000001'
	const second = 'project_2/00000000-0000-0000-0000-000000000002'
	await db
		.insertInto('media_asset')
		.values(
			[first, second].map(key => ({
				key,
				project_id: 2,
				purpose: 'MEDIA',
				filename: 'Unreferenced',
				content_type: 'text/plain',
				size: 1,
				expires_at: new Date(0)
			}))
		)
		.execute()
	const child = new Container({ parent: container })
	child.bind(MediaAssets).toSelf()
	child.bind(S3Client).toConstantValue({
		deleteFileAndThumbnails: deleteFile
	} as unknown as S3Client)
	deleteFile.mockRejectedValueOnce(new Error('Synthetic storage failure'))
	await child.get(MediaAssets).expire()
	expect(deleteFile).toHaveBeenCalledWith(second)
	expect(
		await db
			.selectFrom('media_asset')
			.select(['key', 'cleanup_attempts'])
			.where('project_id', '=', 2)
			.execute()
	).toEqual([{ key: first, cleanup_attempts: 1 }])
})

test('successful import publishes project-scoped notifications and removes its upload', async () => {
	await db
		.updateTable('node')
		.where('id', '=', 11)
		.set({ type: NodeType.list })
		.execute()
	const file = 'project_1/00000000-0000-0000-0000-000000000001'
	getContent.mockResolvedValue('[]')
	await confirmedImport(
		{
			node_id: 11,
			data: file,
			structure: true,
			list_path: null,
			external_id: undefined
		},
		ctx
	)
	expect(getContent).toHaveBeenCalledWith(file, 10 * 1024 * 1024)
	expect(publish).toHaveBeenCalledWith(Topic.NodesUpdated, 1)
	expect(publish).toHaveBeenCalledWith(Topic.ValuesUpdated, 1)
	expect(deleteFile).toHaveBeenCalledWith(file)
})
