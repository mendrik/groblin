import { graphql } from 'graphql'
import { expect, test } from 'vitest'
import {
	container,
	ctx,
	db,
	publish,
	rowRevision,
	schema
} from '../../tests/resolver-context.ts'
import { DeletionKind } from '../gql/schema.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { NodeType, Topic } from '../types.ts'
import { deletionSnapshot } from './deletion-impact.ts'

async function content() {
	const nodes = container.get(NodeResolver)
	const values = container.get(ValueResolver)
	const list = await nodes.insertNode(
		{ name: 'Entries', type: NodeType.list, order: 1, parent_id: 10 },
		undefined,
		ctx
	)
	const field = await nodes.insertNode(
		{ name: 'Title', type: NodeType.string, order: 0, parent_id: list.id },
		undefined,
		ctx
	)
	const media = await nodes.insertNode(
		{ name: 'Photo', type: NodeType.media, order: 1, parent_id: list.id },
		undefined,
		ctx
	)
	const item = await values.insertListItem(
		{ node_id: list.id, name: 'Entry' },
		ctx
	)
	const { id: title } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: field.id,
			list_path: [item],
			value: { content: 'Before' }
		},
		ctx
	)
	const { id: photo } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: media.id,
			list_path: [item],
			value: {
				file: 'project_1/00000000-0000-0000-0000-000000000001',
				name: 'photo.png',
				contentType: 'image/png',
				size: 10
			}
		},
		ctx
	)
	publish.mockClear()
	return { nodes, values, list, field, item, title, photo }
}

test('the API previews cascading field, content, list and media deletion counts', async () => {
	const { list } = await content()
	const result = await graphql({
		schema,
		contextValue: ctx,
		source:
			'query($id: Int!) { getDeletionImpact(target: { kind: NODE, id: $id }) { fingerprint name fields values listItems mediaFiles fieldNames } }',
		variableValues: { id: list.id }
	})
	expect(result.errors).toBeUndefined()
	expect(result.data?.getDeletionImpact).toEqual({
		fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
		name: 'Entries',
		fields: 3,
		values: 3,
		listItems: 1,
		mediaFiles: 1,
		fieldNames: ['Entries', 'Title', 'Photo']
	})
	expect(publish).not.toHaveBeenCalled()
})

test('a stale preview cannot delete subsequently edited content', async () => {
	const { nodes, values, list, field, item, title } = await content()
	const { impact } = await deletionSnapshot(db, 1, {
		kind: DeletionKind.Node,
		id: list.id
	})
	await values.upsertValue(
		{
			expectedRevision: await rowRevision('values', title),
			id: title,
			node_id: field.id,
			list_path: [item],
			value: { content: 'After' }
		},
		ctx
	)
	publish.mockClear()
	await expect(
		nodes.deleteNodeById(list.id, 10, 0, ctx, impact.fingerprint)
	).rejects.toThrow('Content changed')
	expect(await values.value(title, 1)).toMatchObject({
		value: { content: 'After' }
	})
	expect(await nodes.getNode(list.id, 1)).toBeDefined()
	expect(publish).not.toHaveBeenCalled()
})

test('confirmed node deletion emits cleanup for every cascaded value', async () => {
	const { nodes, values, list, item, title, photo } = await content()
	const { impact } = await deletionSnapshot(db, 1, {
		kind: DeletionKind.Node,
		id: list.id
	})
	await nodes.deleteNodeById(list.id, 10, 0, ctx, impact.fingerprint)
	for (const id of [item, title, photo]) {
		expect(await values.value(id, 1)).toBeUndefined()
		expect(publish).toHaveBeenCalledWith(
			Topic.ValueDeleted,
			expect.objectContaining({ id, project_id: 1 })
		)
	}
	expect(await values.value(200, 2)).toBeDefined()
})

test('clearing a list preserves its fields and accounts for all cascading values', async () => {
	const { nodes, values, list, field, item, title, photo } = await content()
	const { impact } = await deletionSnapshot(db, 1, {
		kind: DeletionKind.NodeValues,
		id: list.id
	})
	expect(impact).toMatchObject({
		fields: 0,
		values: 3,
		listItems: 1,
		mediaFiles: 1
	})
	expect(
		await values.truncate(
			{ node_id: list.id, expectedImpact: impact.fingerprint },
			ctx
		)
	).toBe(true)
	expect(await nodes.getNode(field.id, 1)).toBeDefined()
	for (const id of [item, title, photo])
		expect(publish).toHaveBeenCalledWith(
			Topic.ValueDeleted,
			expect.objectContaining({ id })
		)
})

test('a list-item preview includes descendants and rejects an unconfirmed delete', async () => {
	const { values, item, title } = await content()
	const { impact } = await deletionSnapshot(db, 1, {
		kind: DeletionKind.Value,
		id: item
	})
	expect(impact).toMatchObject({
		name: 'Entry',
		fields: 0,
		values: 3,
		listItems: 1,
		mediaFiles: 1
	})
	await expect(values.deleteListItem(item, ctx, '')).rejects.toThrow(
		'Content changed'
	)
	expect(await values.value(title, 1)).toBeDefined()
	expect(await values.deleteListItem(item, ctx, impact.fingerprint)).toBe(true)
	expect(await values.value(title, 1)).toBeUndefined()
})

test('preview rejects another project and tokens are bound to the target', async () => {
	const { values, list, item } = await content()
	await expect(
		deletionSnapshot(db, 1, { kind: DeletionKind.Node, id: 21 })
	).rejects.toThrow('no longer exists')
	const { impact } = await deletionSnapshot(db, 1, {
		kind: DeletionKind.Node,
		id: list.id
	})
	await expect(
		values.deleteListItem(item, ctx, impact.fingerprint)
	).rejects.toThrow('Content changed')
	expect(publish).not.toHaveBeenCalled()
})
