import { expect, test } from 'vitest'
import {
	confirmedImport,
	container,
	ctx,
	db,
	deleteFile,
	getContent,
	impactToken,
	publish,
	rowRevision
} from '../../tests/resolver-context.ts'
import { DeletionKind } from '../gql/schema.ts'
import { hashApiKey } from '../security/api-key.ts'
import { PublicServer } from '../services/public-server.ts'
import { NodeType, Topic } from '../types.ts'
import { ApiKeyResolver } from './api-key-resolver.ts'
import { NodeResolver } from './node-resolver.ts'
import { NodeSettingsResolver } from './node-settings-resolver.ts'
import { ProjectResolver } from './project-resolver.ts'
import { ValueResolver } from './value-resolver.ts'

const ownNodes = () =>
	db
		.selectFrom('node')
		.selectAll()
		.where('project_id', '=', 1)
		.orderBy('id')
		.execute()
const file = 'project_1/00000000-0000-0000-0000-000000000001'
const importPayload = {
	node_id: 11,
	data: file,
	structure: true,
	list_path: null,
	external_id: undefined
}

test('node insertion reorders only its siblings and creates settings atomically', async () => {
	const node = await container
		.get(NodeResolver)
		.insertNode(
			{ name: 'First', type: NodeType.number, parent_id: 10, order: 0 },
			{ required: true },
			ctx
		)
	expect(await ownNodes()).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: node.id, parent_id: 10, order: 0 }),
			expect.objectContaining({ id: 11, order: 1 })
		])
	)
	expect(
		await db
			.selectFrom('node')
			.select('order')
			.where('id', '=', 21)
			.executeTakeFirstOrThrow()
	).toEqual({ order: 0 })
	expect(
		await container.get(NodeSettingsResolver).getNodeSettings(ctx)
	).toEqual([
		expect.objectContaining({
			node_id: node.id,
			settings: expect.objectContaining({ required: true })
		})
	])
	expect(publish).toHaveBeenCalledWith(Topic.NodesUpdated, 1)
	expect(publish).toHaveBeenCalledWith(Topic.SomeNodeSettingsUpdated, 1)
})

test('a failed insertion rolls back sibling reordering and emits no event', async () => {
	const before = await ownNodes()
	// PostgreSQL rejects a NUL byte after the preceding reorder UPDATE has executed.
	await expect(
		container.get(NodeResolver).insertNode(
			{
				name: 'Invalid\0name',
				type: NodeType.string,
				parent_id: 10,
				order: 0
			},
			undefined,
			ctx
		)
	).rejects.toThrow()
	expect(await ownNodes()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('delete uses stored parent and order instead of browser hints', async () => {
	const nodes = container.get(NodeResolver)
	const sibling = await nodes.insertNode(
		{ name: 'Next', type: NodeType.string, parent_id: 10, order: 1 },
		undefined,
		ctx
	)
	expect(
		await nodes.deleteNodeById(
			11,
			20,
			999,
			ctx,
			await impactToken(DeletionKind.Node, 11)
		)
	).toBe(true)
	expect(await nodes.getNode(sibling.id, 1)).toMatchObject({
		order: 0,
		parent_id: 10
	})
	expect(await nodes.getNode(21, 2)).toMatchObject({ order: 0, parent_id: 20 })
})

test('root deletion and cyclic reparenting preserve the tree', async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.object })
		.where('id', '=', 11)
		.execute()
	const nodes = container.get(NodeResolver)
	const child = await nodes.insertNode(
		{ name: 'Child', type: NodeType.object, parent_id: 11, order: 0 },
		undefined,
		ctx
	)
	const before = await ownNodes()
	publish.mockClear()
	await expect(nodes.deleteNodeById(10, undefined, 0, ctx, '')).rejects.toThrow(
		'Cannot delete project root'
	)
	for (const parent_id of [11, child.id]) {
		await expect(
			nodes.updateNode(
				{
					expectedRevision: await rowRevision('node', 11),
					id: 11,
					name: 'Own',
					type: NodeType.object,
					order: 0,
					parent_id
				},
				ctx
			)
		).rejects.toThrow('Invalid parent')
	}
	expect(await ownNodes()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('settings update preserves its identity and rejects moving settings to another node', async () => {
	const settings = container.get(NodeSettingsResolver)
	const { id } = await settings.upsertNodeSettings(
		{ expectedRevision: 0, node_id: 11, settings: { required: true } },
		ctx
	)
	expect(
		await settings.upsertNodeSettings(
			{
				expectedRevision: await rowRevision('node_settings', id),
				id,
				node_id: 11,
				settings: { required: false }
			},
			ctx
		)
	).toMatchObject({ id })
	await expect(
		settings.upsertNodeSettings(
			{
				expectedRevision: await rowRevision('node_settings', id),
				id,
				node_id: 10,
				settings: {}
			},
			ctx
		)
	).rejects.toThrow('Settings not found')
	expect(await settings.getNodeSettings(ctx)).toEqual([
		expect.objectContaining({
			id,
			node_id: 11,
			settings: expect.objectContaining({ required: false })
		})
	])
})

test('media replacement cleans up the previous file only when the key changes', async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.media })
		.where('id', '=', 11)
		.execute()
	const values = container.get(ValueResolver)
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 11,
			list_path: null,
			value: { file, name: 'old', contentType: 'image/png', size: 10 }
		},
		ctx
	)
	publish.mockClear()
	await values.upsertValue(
		{
			expectedRevision: await rowRevision('values', id),
			id,
			node_id: 11,
			list_path: null,
			value: { file, name: 'renamed', contentType: 'image/png', size: 10 }
		},
		ctx
	)
	expect(
		publish.mock.calls.filter(([topic]) => topic === Topic.ValueDeleted)
	).toEqual([])
	await values.upsertValue(
		{
			expectedRevision: await rowRevision('values', id),
			id,
			node_id: 11,
			list_path: null,
			value: {
				file: file.replace(/1$/, '2'),
				name: 'new',
				contentType: 'image/png',
				size: 10
			}
		},
		ctx
	)
	expect(publish).toHaveBeenCalledWith(
		Topic.ValueDeleted,
		expect.objectContaining({
			id,
			project_id: 1,
			value: { file, name: 'renamed', contentType: 'image/png', size: 10 }
		})
	)
	publish.mockClear()
	expect(
		await values.deleteValue(id, ctx, await impactToken(DeletionKind.Value, id))
	).toBe(true)
	await expect(values.deleteValue(id, ctx, '')).rejects.toThrow(
		'no longer exists'
	)
	expect(
		publish.mock.calls.filter(([topic]) => topic === Topic.ValueDeleted)
	).toHaveLength(1)
})

test('a value id cannot be reassigned to a different owned node', async () => {
	const values = container.get(ValueResolver)
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 11,
			list_path: null,
			value: { content: 'keep' }
		},
		ctx
	)
	publish.mockClear()
	await expect(
		values.upsertValue(
			{
				expectedRevision: await rowRevision('values', id),
				id,
				node_id: 10,
				list_path: null,
				value: { content: 'replace' }
			},
			ctx
		)
	).rejects.toThrow('Value no longer available')
	expect(await values.value(id, 1)).toMatchObject({
		node_id: 11,
		value: { content: 'keep' }
	})
	expect(publish).not.toHaveBeenCalled()
})

test('truncate cannot erase a foreign node, and preserves other nodes in its own project', async () => {
	const values = container.get(ValueResolver)
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 11,
			list_path: null,
			value: { content: 'valid' }
		},
		ctx
	)
	const other = await container
		.get(NodeResolver)
		.insertNode(
			{ name: 'Other', type: NodeType.string, parent_id: 10, order: 1 },
			undefined,
			ctx
		)
	await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: other.id,
			list_path: null,
			value: { content: 'valid' }
		},
		ctx
	)
	await expect(
		values.truncate({ node_id: 21, expectedImpact: '' }, ctx)
	).rejects.toThrow('no longer exists')
	expect(await values.value(200, 2)).toBeDefined()
	expect(
		await values.truncate(
			{
				node_id: 11,
				expectedImpact: await impactToken(DeletionKind.NodeValues, 11)
			},
			ctx
		)
	).toBe(true)
	expect(await values.value(id, 1)).toBeUndefined()
	expect(await values.getValues({ ids: [] }, ctx)).toEqual([
		expect.objectContaining({ node_id: other.id })
	])
})

test('duplicate and non-list paths are rejected without writing values', async () => {
	const values = container.get(ValueResolver)
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 11,
			list_path: null,
			value: { content: 'valid' }
		},
		ctx
	)
	for (const list_path of [[id], [id, id], [999999]]) {
		await expect(
			values.upsertValue(
				{
					expectedRevision: 0,
					node_id: 11,
					list_path,
					value: { content: 'valid' }
				},
				ctx
			)
		).rejects.toThrow('Invalid list path')
	}
	expect(await values.getValues({ ids: [] }, ctx)).toHaveLength(1)
})

test('API key disable, re-enable and deletion apply immediately to cached schemas', async () => {
	const keys = container.get(ApiKeyResolver)
	const server = container.get(PublicServer)
	const key = await keys.createApiKey(ctx, {
		name: 'Lifecycle',
		expires_at: null
	})
	const fingerprint = hashApiKey(key.key)
	expect(await keys.getApiKeys(ctx)).toEqual([
		expect.objectContaining({ key: fingerprint })
	])
	await container.get(ProjectResolver).publishContent(0, 0, undefined, ctx)
	await server.schema(key.key)
	expect(await keys.toggleApiKey(ctx, fingerprint)).toBe(true)
	await expect(server.schema(key.key)).rejects.toThrow()
	expect(await keys.toggleApiKey(ctx, fingerprint)).toBe(true)
	await expect(server.schema(key.key)).resolves.toBeDefined()
	expect(await keys.deleteApiKey(ctx, fingerprint)).toBe(true)
	await expect(server.schema(key.key)).rejects.toThrow()
})

test('API key listing, toggling and deletion are scoped to the current project', async () => {
	const keys = container.get(ApiKeyResolver)
	await db
		.insertInto('project_user')
		.values({
			project_id: 2,
			user_id: ctx.user.id,
			roles: ['Admin'],
			confirmed: true
		})
		.execute()
	const foreign = await keys.createApiKey(
		{ ...ctx, project_id: 2 },
		{ name: 'Foreign', expires_at: null }
	)
	const fingerprint = hashApiKey(foreign.key)
	expect(await keys.getApiKeys(ctx)).toEqual([])
	expect(await keys.toggleApiKey(ctx, fingerprint)).toBe(false)
	expect(await keys.deleteApiKey(ctx, fingerprint)).toBe(false)
	await expect(container.get(PublicServer).schema(foreign.key)).rejects.toThrow(
		'no published content'
	)
	expect(
		await db
			.selectFrom('api_key')
			.select('is_active')
			.where('key', '=', fingerprint)
			.executeTakeFirst()
	).toEqual({ is_active: true })
})

test('API key operations recheck membership instead of trusting the context role', async () => {
	const keys = container.get(ApiKeyResolver)
	const created = await keys.createApiKey(ctx, {
		name: 'Protected',
		expires_at: null
	})
	await db
		.updateTable('project_user')
		.set({ roles: ['Viewer'], owner: false })
		.where('project_id', '=', ctx.project_id)
		.where('user_id', '=', ctx.user.id)
		.execute()
	await expect(
		keys.createApiKey(ctx, { name: 'Denied', expires_at: null })
	).rejects.toThrow('Not authorized')
	await expect(keys.toggleApiKey(ctx, hashApiKey(created.key))).rejects.toThrow(
		'Not authorized'
	)
	await expect(keys.deleteApiKey(ctx, hashApiKey(created.key))).rejects.toThrow(
		'Not authorized'
	)
	await expect(keys.getApiKeys(ctx)).rejects.toThrow('Not authorized')
})

test.each([
	'not json',
	'{}',
	JSON.stringify(Array.from({ length: 10001 }, () => ({})))
])(
	'malformed or oversized imports preserve data and their upload (%#)',
	async content => {
		getContent.mockResolvedValue(content)
		const before = await ownNodes()
		await expect(confirmedImport(importPayload, ctx)).rejects.toThrow()
		expect(await ownNodes()).toEqual(before)
		expect(deleteFile).not.toHaveBeenCalled()
		expect(publish).not.toHaveBeenCalled()
	}
)

test('nested import creates typed values and list paths in the owning project', async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.list })
		.where('id', '=', 11)
		.execute()
	getContent.mockResolvedValue(
		JSON.stringify([
			{
				name: 'Alex',
				age: 42,
				active: true,
				address: { city: 'Helsinki' },
				tags: [{ label: 'Editor' }]
			}
		])
	)
	await confirmedImport(importPayload, ctx)
	const nodes = await ownNodes()
	expect(nodes).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ name: 'Age', type: NodeType.number }),
			expect.objectContaining({ name: 'Active', type: NodeType.boolean }),
			expect.objectContaining({ name: 'Address', type: NodeType.object }),
			expect.objectContaining({ name: 'Tags', type: NodeType.list })
		])
	)
	const values = await db
		.selectFrom('values')
		.where('project_id', '=', 1)
		.selectAll()
		.execute()
	const root = values.find(v => v.node_id === 11)
	expect(root).toBeDefined()
	expect(values).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				value: { content: 'Alex' },
				list_path: [root?.id]
			}),
			expect.objectContaining({ value: { figure: 42 }, list_path: [root?.id] }),
			expect.objectContaining({ value: { state: true }, list_path: [root?.id] })
		])
	)
	const tag = values.find(
		v => v.node_id === nodes.find(n => n.name === 'Tags')?.id
	)
	expect(values).toContainEqual(
		expect.objectContaining({
			value: { content: 'Editor' },
			list_path: [root?.id, tag?.id]
		})
	)
	expect(await container.get(ValueResolver).value(200, 2)).toMatchObject({
		value: { text: 'private' }
	})
	expect(deleteFile).toHaveBeenCalledExactlyOnceWith(file)
})

test('a database failure during import rolls back nodes and settings and retains the upload', async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.list })
		.where('id', '=', 11)
		.execute()
	const before = await ownNodes()
	// Duplicate external IDs roll back the earlier fields and values.
	getContent.mockResolvedValue(
		JSON.stringify([
			{ id: 'duplicate', name: 'One' },
			{ id: 'duplicate', name: 'Two' }
		])
	)
	await expect(
		confirmedImport({ ...importPayload, external_id: 'id' }, ctx)
	).rejects.toThrow('Duplicate external ID in import')
	expect(await ownNodes()).toEqual(before)
	expect(
		await container.get(NodeSettingsResolver).getNodeSettings(ctx)
	).toEqual([])
	expect(
		await container.get(ValueResolver).getValues({ ids: [] }, ctx)
	).toEqual([])
	expect(publish).not.toHaveBeenCalled()
	expect(deleteFile).not.toHaveBeenCalled()
})
