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
import { requireListPath } from '../security/project-access.ts'
import { NodeType } from '../types.ts'
import { ValueResolver } from './value-resolver.ts'

async function nestedLists() {
	await db
		.insertInto('node')
		.values([
			{
				id: 30,
				project_id: 1,
				parent_id: 10,
				name: 'Teams',
				type: NodeType.list,
				order: 1
			},
			{
				id: 31,
				project_id: 1,
				parent_id: 30,
				name: 'Members',
				type: NodeType.list,
				order: 0
			},
			{
				id: 32,
				project_id: 1,
				parent_id: 31,
				name: 'Label',
				type: NodeType.string,
				order: 0
			},
			{
				id: 33,
				project_id: 1,
				parent_id: 10,
				name: 'Other',
				type: NodeType.list,
				order: 2
			}
		])
		.execute()
	const values = container.get(ValueResolver)
	const first = await values.insertListItem({ node_id: 30, name: 'first' }, ctx)
	const second = await values.insertListItem(
		{ node_id: 30, name: 'second' },
		ctx
	)
	const member = await values.insertListItem(
		{ node_id: 31, list_path: [first], name: 'member' },
		ctx
	)
	const other = await values.insertListItem({ node_id: 33, name: 'other' }, ctx)
	publish.mockClear()
	return { first, second, member, other, values }
}

test('nested writes require the exact ordered ancestor list instances', async () => {
	const { first, second, member, other, values } = await nestedLists()
	for (const list_path of [
		null,
		[],
		[first],
		[member, first],
		[other, member],
		[second, member],
		[first, first],
		[first, 999999]
	]) {
		await expect(
			values.upsertValue(
				{
					expectedRevision: 0,
					node_id: 32,
					list_path,
					value: { content: 'invalid' }
				},
				ctx
			)
		).rejects.toThrow('Invalid list path')
	}
	expect(publish).not.toHaveBeenCalled()
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 32,
			list_path: [first, member],
			value: { content: 'valid' }
		},
		ctx
	)
	expect(await values.value(id, 1)).toMatchObject({
		list_path: [first, member],
		value: { content: 'valid' }
	})
	await expect(
		values.insertListItem({ node_id: 11, name: 'invalid' }, ctx)
	).rejects.toThrow('list node')
})

test('an existing value cannot be moved into another valid list instance', async () => {
	const { first, second, member, values } = await nestedLists()
	const sibling = await values.insertListItem(
		{ node_id: 31, list_path: [second], name: 'sibling' },
		ctx
	)
	const { id } = await values.upsertValue(
		{
			expectedRevision: 0,
			node_id: 32,
			list_path: [first, member],
			value: { content: 'original' }
		},
		ctx
	)
	await expect(
		values.upsertValue(
			{
				expectedRevision: await rowRevision('values', id),
				id,
				node_id: 32,
				list_path: [second, sibling],
				value: { content: 'move' }
			},
			ctx
		)
	).rejects.toThrow('cannot be moved')
	expect(await values.value(id, 1)).toMatchObject({
		list_path: [first, member],
		value: { content: 'original' }
	})
})

test('malformed stored ancestry and unknown targets are rejected', async () => {
	const { first, member } = await nestedLists()
	await expect(requireListPath(db, 1, 99999, [])).rejects.toThrow(
		'Invalid list path'
	)
	await db
		.updateTable('values')
		.set({ list_path: [] })
		.where('id', '=', member)
		.execute()
	await expect(requireListPath(db, 1, 32, [first, member])).rejects.toThrow(
		'Invalid list path'
	)
	await db
		.updateTable('node')
		.set({ parent_id: 31 })
		.where('id', '=', 30)
		.execute()
	await expect(requireListPath(db, 1, 32, [first, member])).rejects.toThrow(
		'Invalid list path'
	)
})

test('GraphQL reports actionable validation errors without committing content', async () => {
	const result = await graphql({
		schema,
		contextValue: ctx,
		source:
			'mutation { upsertValue(data: { expectedRevision: 0, node_id: 11, value: { content: 42 } }) { id revision } }'
	})
	expect(result.errors?.[0]).toMatchObject({
		extensions: {
			code: 'BAD_USER_INPUT',
			issues: [{ path: ['content'], message: expect.any(String) }]
		}
	})
	expect(
		await container.get(ValueResolver).getValues({ ids: [] }, ctx)
	).toEqual([])
	expect(publish).not.toHaveBeenCalled()
})

test('GraphQL exposes a safe list-path error', async () => {
	const result = await graphql({
		schema,
		contextValue: ctx,
		source:
			'mutation { upsertValue(data: { expectedRevision: 0, node_id: 11, list_path: [999], value: { content: "text" } }) { id revision } }'
	})
	expect(result.errors?.[0]).toMatchObject({
		message: 'Invalid list path',
		extensions: { code: 'BAD_USER_INPUT' }
	})
})
