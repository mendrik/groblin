import { graphql } from 'graphql'
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
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { NodeSettingsResolver } from '../resolvers/node-settings-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { NodeType } from '../types.ts'
import { SchemaService } from './schema-service.ts'

const snapshot = async () => ({
	nodes: await db
		.selectFrom('node')
		.selectAll()
		.where('project_id', '=', 1)
		.orderBy('id')
		.execute(),
	settings: await db
		.selectFrom('node_settings')
		.selectAll()
		.where('project_id', '=', 1)
		.orderBy('id')
		.execute(),
	values: await db
		.selectFrom('values')
		.selectAll()
		.where('project_id', '=', 1)
		.orderBy('id')
		.execute()
})
const insert = (name: string, type = NodeType.string, parent_id = 10) =>
	container
		.get(NodeResolver)
		.insertNode({ name, type, parent_id, order: 0 }, undefined, ctx)

test.each(['bad name', '1field', '__hidden', '_empty', 'Own'])(
	'invalid or duplicate API field %s rolls back the entire edit',
	async name => {
		const before = await snapshot()
		await expect(insert(name)).rejects.toThrow()
		expect(await snapshot()).toEqual(before)
		expect(publish).not.toHaveBeenCalled()
	}
)

test('the full generated type graph is validated before committing a model', async () => {
	const before = await snapshot()
	await expect(insert('String', NodeType.object)).rejects.toThrow(
		'Invalid API model'
	)
	expect(await snapshot()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('filter aliases cannot silently replace another field', async () => {
	const list = await insert('Entries', NodeType.list)
	await insert('Title', NodeType.string, list.id)
	const before = await snapshot()
	publish.mockClear()
	await expect(insert('Title_not', NodeType.string, list.id)).rejects.toThrow(
		'Ambiguous filter'
	)
	expect(await snapshot()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('new empty lists and a completely empty project expose valid schemas', async () => {
	const list = await insert('Entries', NodeType.list)
	const values = container.get(ValueResolver)
	await values.insertListItem({ node_id: list.id, name: 'Empty item' }, ctx)
	let schema = await container.get(SchemaService).getSchema(1)
	const result = await graphql({ schema, source: '{ Entries { _empty } }' })
	expect(result.errors).toBeUndefined()
	expect(result.data).toEqual({ Entries: [{ _empty: true }] })
	const nodes = container.get(NodeResolver)
	await nodes.deleteNodeById(
		list.id,
		10,
		0,
		ctx,
		await impactToken(DeletionKind.Node, list.id)
	)
	await nodes.deleteNodeById(
		11,
		10,
		0,
		ctx,
		await impactToken(DeletionKind.Node, 11)
	)
	schema = await container.get(SchemaService).getSchema(1)
	expect((await graphql({ schema, source: '{ _empty }' })).data).toEqual({
		_empty: true
	})
})

test('changing a field type cannot invalidate stored content', async () => {
	await container
		.get(ValueResolver)
		.upsertValue(
			{ expectedRevision: 0, node_id: 11, value: { content: 'Keep me' } },
			ctx
		)
	const before = await snapshot()
	publish.mockClear()
	await expect(
		container.get(NodeResolver).updateNode(
			{
				expectedRevision: await rowRevision('node', 11),
				id: 11,
				name: 'Own',
				type: NodeType.number
			},
			ctx
		)
	).rejects.toThrow('would invalidate value')
	expect(await snapshot()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('moving populated content into a list is rejected instead of making it disappear', async () => {
	const list = await insert('Entries', NodeType.list)
	await container
		.get(ValueResolver)
		.upsertValue(
			{ expectedRevision: 0, node_id: 11, value: { content: 'Keep me' } },
			ctx
		)
	const before = await snapshot()
	publish.mockClear()
	await expect(
		container.get(NodeResolver).updateNode(
			{
				expectedRevision: await rowRevision('node', 11),
				id: 11,
				name: 'Own',
				parent_id: list.id
			},
			ctx
		)
	).rejects.toThrow('outside its list')
	expect(await snapshot()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('moving an object subtree updates descendant depths without changing its content', async () => {
	const group = await insert('Group', NodeType.object)
	const nested = await insert('Nested', NodeType.object, group.id)
	const field = await insert('Label', NodeType.string, nested.id)
	await container
		.get(ValueResolver)
		.upsertValue(
			{ expectedRevision: 0, node_id: field.id, value: { content: 'Keep me' } },
			ctx
		)
	await container.get(NodeResolver).updateNode(
		{
			expectedRevision: await rowRevision('node', nested.id),
			id: nested.id,
			name: 'Nested',
			parent_id: 10
		},
		ctx
	)
	expect(await container.get(NodeResolver).getNode(field.id, 1)).toMatchObject({
		depth: 3
	})
	expect(
		await container.get(ValueResolver).getValues({ ids: [] }, ctx)
	).toEqual([expect.objectContaining({ value: { content: 'Keep me' } })])
})

test('media types, thumbnail fields and fractional color alpha survive model validation', async () => {
	const nodes = container.get(NodeResolver)
	const media = await nodes.insertNode(
		{ name: 'Image', type: NodeType.media, parent_id: 10, order: 0 },
		{ thumbnails: ['100', '200x100'] },
		ctx
	)
	const color = await insert('Tint', NodeType.color)
	const values = container.get(ValueResolver)
	await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: media.id,
			value: {
				name: 'photo.png',
				file: 'project_1/00000000-0000-0000-0000-000000000001',
				size: 10,
				contentType: 'image/png'
			}
		},
		ctx
	)
	await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: color.id,
			value: { rgba: [12, 34, 56, 0.5] }
		},
		ctx
	)
	const schema = await container.get(SchemaService).getSchema(1)
	const result = await graphql({
		schema,
		source: '{ Image { url contentType url_100 url_200x100 } Tint }'
	})
	expect(result.errors).toBeUndefined()
	expect(result.data).toEqual({
		Image: {
			url: 'unused',
			contentType: 'image/png',
			url_100: 'unused',
			url_200x100: 'unused'
		},
		Tint: [12, 34, 56, 0.5]
	})
})

test('settings changes that introduce a generated type collision roll back', async () => {
	const choice = await insert('String', NodeType.choice)
	const before = await snapshot()
	publish.mockClear()
	await expect(
		container.get(NodeSettingsResolver).upsertNodeSettings(
			{
				expectedRevision: 0,
				node_id: choice.id,
				settings: { choices: ['Allowed'] }
			},
			ctx
		)
	).rejects.toThrow('Invalid API model')
	expect(await snapshot()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
})

test('an imported invalid model rolls back and preserves its source upload for correction', async () => {
	const list = await insert('Entries', NodeType.list)
	const before = await snapshot()
	publish.mockClear()
	getContent.mockResolvedValue('[{"bad field name":"Keep me"}]')
	await expect(
		confirmedImport(
			{
				node_id: list.id,
				structure: true,
				data: 'project_1/00000000-0000-0000-0000-000000000001'
			},
			ctx
		)
	).rejects.toThrow('Invalid API field name')
	expect(await snapshot()).toEqual(before)
	expect(publish).not.toHaveBeenCalled()
	expect(deleteFile).not.toHaveBeenCalled()
})
