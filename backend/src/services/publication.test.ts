import { graphql, printSchema } from 'graphql'
import { afterEach, expect, test, vi } from 'vitest'
import { container, ctx, db } from '../../tests/resolver-context.ts'
import { ApiKeyResolver } from '../resolvers/api-key-resolver.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { ProjectResolver } from '../resolvers/project-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { Role } from '../types.ts'
import { PublicServer } from './public-server.ts'
import { SchemaService } from './schema-service.ts'

const projects = () => container.get(ProjectResolver)
const values = () => container.get(ValueResolver)
const key = (preview = false) =>
	container
		.get(ApiKeyResolver)
		.createApiKey(ctx, { name: preview ? 'Preview' : 'Website', preview })
const published = (
	version: number,
	expectedPublication = 0,
	revision?: number
) => projects().publishContent(version, expectedPublication, revision, ctx)
const query = async (apiKey: string, source = '{ Own }') =>
	graphql({ schema: await container.get(PublicServer).schema(apiKey), source })

afterEach(() => vi.unstubAllEnvs())

test('production keys expose only a publication; preview keys expose the current immutable draft revision', async () => {
	const production = await key()
	const preview = await key(true)
	await expect(query(production.key)).rejects.toThrow('no published content')
	await values().upsertValue(
		{ node_id: 11, expectedRevision: 0, value: { content: 'First' } },
		ctx
	)
	const initial = await published(1)
	expect((await query(production.key)).data).toEqual({ Own: 'First' })
	const value = await db
		.selectFrom('values')
		.selectAll()
		.where('project_id', '=', 1)
		.executeTakeFirstOrThrow()
	await values().upsertValue(
		{
			id: value.id,
			node_id: 11,
			expectedRevision: value.revision,
			value: { content: 'Draft only' }
		},
		ctx
	)
	expect((await query(production.key)).data).toEqual({ Own: 'First' })
	expect((await query(preview.key)).data).toEqual({ Own: 'Draft only' })
	const next = await published(2, initial.id)
	expect((await query(production.key)).data).toEqual({ Own: 'Draft only' })
	expect(await projects().getPublication(ctx)).toMatchObject({
		draftVersion: 2,
		current: { id: next.id, version: 2 },
		history: [{ id: next.id }, { id: initial.id }]
	})
})

test('model edits do not change published schema until publication, and rollback leaves drafts intact', async () => {
	await values().upsertValue(
		{ node_id: 11, expectedRevision: 0, value: { content: 'Saved' } },
		ctx
	)
	const first = await published(1)
	const production = await key()
	const preview = await key(true)
	await container
		.get(NodeResolver)
		.updateNode({ id: 11, name: 'Renamed', expectedRevision: 1 }, ctx)
	expect(
		printSchema(await container.get(PublicServer).schema(production.key))
	).toContain('Own: String')
	expect(
		printSchema(await container.get(PublicServer).schema(preview.key))
	).toContain('Renamed: String')
	const second = await published(2, first.id)
	expect((await query(production.key, '{ Renamed }')).data).toEqual({
		Renamed: 'Saved'
	})
	const rollback = await published(2, second.id, first.revision_id)
	expect(rollback.version).toBe(1)
	expect((await query(production.key)).data).toEqual({ Own: 'Saved' })
	expect(
		(await projects().getProject(ctx)).nodes.find(node => node.id === 11)?.name
	).toBe('Renamed')
})

test('stale content and publication reviews cannot overwrite another publication, and foreign revisions are rejected', async () => {
	const first = await published(0)
	await expect(published(0, 0)).rejects.toMatchObject({
		extensions: { code: 'CONFLICT' }
	})
	await values().upsertValue(
		{ node_id: 11, expectedRevision: 0, value: { content: 'New' } },
		ctx
	)
	await expect(published(0, first.id)).rejects.toMatchObject({
		extensions: { code: 'CONFLICT' }
	})
	await expect(published(1, first.id, 99999)).rejects.toMatchObject({
		extensions: { code: 'NOT_FOUND' }
	})
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Editor], owner: false })
		.where('project_id', '=', 1)
		.execute()
	await expect(published(1, first.id)).rejects.toMatchObject({
		extensions: { code: 'FORBIDDEN' }
	})
	expect((await projects().getPublication(ctx)).current?.id).toBe(first.id)
})

test('a schema pinned to a revision still reads the same values after live edits or deletion', async () => {
	await values().upsertValue(
		{ node_id: 11, expectedRevision: 0, value: { content: 'Immutable' } },
		ctx
	)
	const first = await published(1)
	const schema = await container
		.get(SchemaService)
		.getRevisionSchema(1, first.revision_id)
	await db.deleteFrom('values').where('project_id', '=', 1).execute()
	expect((await graphql({ schema, source: '{ Own }' })).data).toEqual({
		Own: 'Immutable'
	})
	await expect(
		container.get(SchemaService).getRevisionSchema(2, first.revision_id)
	).rejects.toThrow('not found')
})

test('publication validates archived model and content before changing the live pointer', async () => {
	const first = await published(0)
	const row = await db
		.selectFrom('content_revision')
		.selectAll()
		.where('id', '=', first.revision_id)
		.executeTakeFirstOrThrow()
	await db
		.updateTable('content_revision')
		.set({
			snapshot: {
				formatVersion: 1,
				project: { id: 1, name: 'One', version: 0 },
				nodes: [],
				settings: [],
				values: []
			}
		})
		.where('id', '=', row.id)
		.execute()
	await expect(published(0, first.id, first.revision_id)).rejects.toThrow(
		'exactly one root'
	)
	expect((await projects().getPublication(ctx)).current?.id).toBe(first.id)
})

test('publishing rejects missing required fields in root and nested list scopes while drafts remain editable', async () => {
	const { NodeSettingsResolver } = await import(
		'../resolvers/node-settings-resolver.ts'
	)
	await container
		.get(NodeSettingsResolver)
		.upsertNodeSettings(
			{ node_id: 11, expectedRevision: 0, settings: { required: true } },
			ctx
		)
	await expect(published(1)).rejects.toThrow('Required field Own is missing')
	await values().upsertValue(
		{ node_id: 11, expectedRevision: 0, value: { content: 'Complete' } },
		ctx
	)
	const first = await published(2)
	const list = await container.get(NodeResolver).insertNode(
		{
			parent_id: 10,
			name: 'Entries',
			type: (await import('../types.ts')).NodeType.list,
			order: 1
		},
		undefined,
		ctx
	)
	const field = await container.get(NodeResolver).insertNode(
		{
			parent_id: list.id,
			name: 'Title',
			type: (await import('../types.ts')).NodeType.string,
			order: 0
		},
		{ required: true },
		ctx
	)
	const item = await values().insertListItem(
		{ node_id: list.id, name: 'Item' },
		ctx
	)
	const version = (await projects().getProject(ctx)).project.version
	await expect(published(version, first.id)).rejects.toThrow(
		`Required field Title is missing in list item ${item}`
	)
	await values().upsertValue(
		{
			node_id: field.id,
			list_path: [item],
			expectedRevision: 0,
			value: { content: 'Ready' }
		},
		ctx
	)
	await expect(
		published((await projects().getProject(ctx)).project.version, first.id)
	).resolves.toBeDefined()
})

test('published media URLs keep their original file after replacement or deletion and reject changed revision signatures', async () => {
	const { createServer } = await import('node:http')
	const { Container } = await import('inversify')
	const { S3Client: AwsS3 } = await import('@aws-sdk/client-s3')
	const { ImageService } = await import('./image-service.ts')
	const { NodeType } = await import('../types.ts')
	const { mediaValueSchema } = await import('@shared/content.ts')
	vi.stubEnv(
		'MEDIA_SIGNING_SECRET',
		'synthetic-signing-secret-of-at-least-32-characters'
	)
	const child = new Container({ parent: container })
	child.bind(ImageService).toSelf()
	child.bind(AwsS3).toConstantValue(
		new AwsS3({
			region: 'eu-north-1',
			credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
		})
	)
	const media = await container
		.get(NodeResolver)
		.insertNode(
			{ parent_id: 10, name: 'File', type: NodeType.media, order: 1 },
			undefined,
			ctx
		)
	const value = await values().upsertValue(
		{
			node_id: media.id,
			expectedRevision: 0,
			value: {
				name: 'Original.txt',
				file: 'project_1/00000000-0000-0000-0000-000000000001',
				contentType: 'text/plain',
				size: 10
			}
		},
		ctx
	)
	const publication = await published(
		(await projects().getProject(ctx)).project.version
	)
	const image = child.get(ImageService)
	const link = image.mediaUrl(
		{ ...value, value: mediaValueSchema.parse(value.value) },
		undefined,
		publication.revision_id
	)
	await values().upsertValue(
		{
			id: value.id,
			node_id: media.id,
			expectedRevision: value.revision,
			value: {
				name: 'New.txt',
				file: 'project_1/00000000-0000-0000-0000-000000000002',
				contentType: 'text/plain',
				size: 11
			}
		},
		ctx
	)
	await db.deleteFrom('values').where('id', '=', value.id).execute()
	const server = createServer((request, response) => {
		void image.handleRequest(request, response)
	})
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
	const address = server.address()
	if (!address || typeof address === 'string')
		throw new Error('Test server address missing')
	const request = new URL(link, `http://127.0.0.1:${address.port}`)
	request.host = `127.0.0.1:${address.port}`
	request.protocol = 'http:'
	try {
		const response = await fetch(request, { redirect: 'manual' })
		expect(response.status).toBe(302)
		expect(response.headers.get('location')).toContain(
			'00000000-0000-0000-0000-000000000001'
		)
		request.searchParams.set('size', '640')
		expect((await fetch(request, { redirect: 'manual' })).status).toBe(403)
	} finally {
		await new Promise<void>((resolve, reject) =>
			server.close(error => (error ? reject(error) : resolve()))
		)
	}
})
