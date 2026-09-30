import { graphql } from 'graphql'
import { beforeEach, expect, test } from 'vitest'
import { container, ctx, db } from '../../tests/resolver-context.ts'
import { ListResolver } from '../resolvers/list-resolver.ts'
import { NodeType } from '../types.ts'
import { SchemaService } from './schema-service.ts'

beforeEach(async () => {
	await db
		.insertInto('node')
		.values([
			{
				id: 30,
				project_id: 1,
				name: 'Teams',
				type: NodeType.list,
				parent_id: 10,
				order: 1
			},
			{
				id: 31,
				project_id: 1,
				name: 'TeamName',
				type: NodeType.string,
				parent_id: 30,
				order: 0
			},
			{
				id: 32,
				project_id: 1,
				name: 'Members',
				type: NodeType.list,
				parent_id: 30,
				order: 1
			},
			{
				id: 33,
				project_id: 1,
				name: 'first_name',
				type: NodeType.string,
				parent_id: 32,
				order: 0
			},
			{
				id: 35,
				project_id: 1,
				name: 'TeamRank',
				type: NodeType.number,
				parent_id: 30,
				order: 2
			}
		])
		.execute()
	await db
		.insertInto('values')
		.values([
			{
				id: 300,
				node_id: 30,
				project_id: 1,
				list_path: null,
				value: { name: 'Alpha' },
				order: 0
			},
			{
				id: 301,
				node_id: 30,
				project_id: 1,
				list_path: null,
				value: { name: 'Beta' },
				order: 1
			},
			{
				id: 302,
				node_id: 31,
				project_id: 1,
				list_path: [300],
				value: { content: 'Alpha' }
			},
			{
				id: 303,
				node_id: 31,
				project_id: 1,
				list_path: [301],
				value: { content: 'Beta' }
			},
			{
				id: 304,
				node_id: 35,
				project_id: 1,
				list_path: [300],
				value: { figure: 90 }
			},
			{
				id: 305,
				node_id: 35,
				project_id: 1,
				list_path: [301],
				value: { figure: 10 }
			},
			{
				id: 310,
				node_id: 32,
				project_id: 1,
				list_path: [300],
				value: { name: 'Alice' },
				order: 0
			},
			{
				id: 311,
				node_id: 32,
				project_id: 1,
				list_path: [301],
				value: { name: 'Bob' },
				order: 0
			},
			{
				id: 320,
				node_id: 33,
				project_id: 1,
				list_path: [300, 310],
				value: { content: 'Alice' }
			},
			{
				id: 321,
				node_id: 33,
				project_id: 1,
				list_path: [301, 311],
				value: { content: 'Bob' }
			}
		])
		.execute()
})

const query = async (source: string) =>
	graphql({ schema: await container.get(SchemaService).getSchema(1), source })

test('nested lists deliver only items belonging to the current parent', async () => {
	const result = await query('{ Teams { TeamName Members { first_name } } }')
	expect(result.errors).toBeUndefined()
	expect(result.data).toEqual({
		Teams: [
			{ TeamName: 'Alpha', Members: [{ first_name: 'Alice' }] },
			{ TeamName: 'Beta', Members: [{ first_name: 'Bob' }] }
		]
	})
})

test('filters preserve underscores in field names and the parent list scope', async () => {
	const result = await query(
		'{ Teams { Members(filter: { first_name_rex: "^Ali" }) { first_name } } }'
	)
	expect(result.errors).toBeUndefined()
	expect(result.data).toEqual({
		Teams: [{ Members: [{ first_name: 'Alice' }] }, { Members: [] }]
	})
})

test('sorting precedes pagination and default descending order respects editor order', async () => {
	const sorted = await query(
		'{ Teams(order: TeamRank, limit: 1) { TeamName } }'
	)
	expect(sorted.errors).toBeUndefined()
	expect(sorted.data).toEqual({ Teams: [{ TeamName: 'Beta' }] })
	const next = await query(
		'{ Teams(order: TeamRank, offset: 1, limit: 1) { TeamName } }'
	)
	expect(next.data).toEqual({ Teams: [{ TeamName: 'Alpha' }] })
	const descending = await query('{ Teams(direction: desc) { TeamName } }')
	expect(descending.data).toEqual({
		Teams: [{ TeamName: 'Beta' }, { TeamName: 'Alpha' }]
	})
})

test('an empty list item stays visible in the editor with no phantom children', async () => {
	await db
		.insertInto('values')
		.values({
			id: 312,
			node_id: 32,
			project_id: 1,
			list_path: [300],
			value: { name: 'New member' },
			order: 1
		})
		.execute()
	const items = await container
		.get(ListResolver)
		.getListItems(ctx, { node_id: 32, list_path: [300] })
	expect(items.map(item => item.id)).toEqual([310, 312])
	expect(items[1].children).toEqual([])
})

test('editor search, filters, typed sorting and pagination use one exact list scope', async () => {
	const resolver = container.get(ListResolver)
	const page = await resolver.getListPage(ctx, {
		node_id: 30,
		limit: 1,
		sort_node_id: 35
	})
	expect(page).toMatchObject({
		total: 2,
		limit: 1,
		offset: 0,
		items: [{ id: 301 }]
	})
	expect(
		(
			await resolver.getListPage(ctx, {
				node_id: 30,
				limit: 1,
				offset: 1,
				sort_node_id: 35
			})
		).items.map(item => item.id)
	).toEqual([300])
	expect(
		(
			await resolver.getListPage(ctx, {
				node_id: 30,
				sort_node_id: 35,
				direction: 'desc'
			})
		).items.map(item => item.id)
	).toEqual([300, 301])
	expect(
		(
			await resolver.getListPage(ctx, { node_id: 30, search: 'bEtA' })
		).items.map(item => item.id)
	).toEqual([301])
	expect(
		(await resolver.getListPage(ctx, { node_id: 30, search: '%_' })).total
	).toBe(0)
	expect(
		(
			await resolver.getListPage(ctx, {
				node_id: 30,
				filters: [
					{ node_id: 35, operator: 'gte', value: '90' },
					{ node_id: 31, operator: 'contains', value: 'ALP' }
				]
			})
		).items.map(item => item.id)
	).toEqual([300])
	expect(
		(
			await resolver.getListPage(ctx, {
				node_id: 32,
				list_path: [300],
				search: 'Bob'
			})
		).total
	).toBe(0)
	expect(
		(
			await resolver.getListPage(ctx, {
				node_id: 32,
				list_path: [301],
				filters: [{ node_id: 33, operator: 'equals', value: 'Bob' }]
			})
		).items.map(item => item.id)
	).toEqual([311])
	expect((await resolver.getListColumns(ctx, 30)).map(node => node.id)).toEqual(
		[31, 35]
	)
})

test('editor queries reject foreign fields, wrong list paths and unbounded paging', async () => {
	const resolver = container.get(ListResolver)
	await expect(
		resolver.getListPage(ctx, { node_id: 30, sort_node_id: 33 })
	).rejects.toThrow('list scope')
	await expect(
		resolver.getListPage(ctx, {
			node_id: 30,
			filters: [{ node_id: 21, operator: 'equals', value: 'private' }]
		})
	).rejects.toThrow('list scope')
	await expect(
		resolver.getListPage(ctx, { node_id: 32, list_path: [301, 300] })
	).rejects.toThrow('Invalid list path')
	await expect(
		resolver.getListPage(ctx, { node_id: 30, limit: 101 })
	).rejects.toThrow()
	await expect(
		resolver.getListPage(ctx, { node_id: 30, offset: -1 })
	).rejects.toThrow()
	await expect(resolver.getListPage(ctx, { node_id: 11 })).rejects.toThrow(
		'Choose a list'
	)
	await expect(
		resolver.getListPage(ctx, {
			node_id: 30,
			filters: [{ node_id: 35, operator: 'equals', value: 'NaN' }]
		})
	).rejects.toThrow('finite number')
	await expect(
		resolver.getListPage(ctx, {
			node_id: 30,
			filters: [{ node_id: 35, operator: 'contains', value: '1' }]
		})
	).rejects.toThrow('text field')
	await expect(
		resolver.getListPage(ctx, {
			node_id: 30,
			filters: [{ node_id: 35, operator: 'equals' }]
		})
	).rejects.toThrow('filter value')
})

test('missing, existence, boolean, date and item-name filters preserve empty items', async () => {
	await db
		.insertInto('node')
		.values([
			{
				id: 36,
				project_id: 1,
				parent_id: 30,
				name: 'Active',
				type: NodeType.boolean,
				order: 3
			},
			{
				id: 37,
				project_id: 1,
				parent_id: 30,
				name: 'When',
				type: NodeType.date,
				order: 4
			},
			{
				id: 38,
				project_id: 1,
				parent_id: 30,
				name: 'Details',
				type: NodeType.object,
				order: 5
			},
			{
				id: 39,
				project_id: 1,
				parent_id: 38,
				name: 'Hidden',
				type: NodeType.string,
				order: 0
			}
		])
		.execute()
	await db
		.insertInto('node_settings')
		.values({ node_id: 39, project_id: 1, settings: { hideColumnHead: true } })
		.execute()
	await db
		.insertInto('values')
		.values([
			{ node_id: 36, project_id: 1, list_path: [300], value: { state: true } },
			{
				node_id: 37,
				project_id: 1,
				list_path: [300],
				value: { date: '2026-09-30T10:00:00+02:00' }
			}
		])
		.execute()
	const resolver = container.get(ListResolver)
	for (const [node_id, operator, value, expected] of [
		[36, 'equals', 'true', [300]],
		[36, 'missing', undefined, [301]],
		[36, 'exists', undefined, [300]],
		[37, 'equals', '2026-09-30T08:00:00Z', [300]],
		[37, 'lt', '2026-09-30T09:00:00Z', [300]],
		[30, 'equals', 'Beta', [301]],
		[30, 'contains', 'alp', [300]]
	] as const)
		expect(
			(
				await resolver.getListPage(ctx, {
					node_id: 30,
					filters: [{ node_id, operator, value }]
				})
			).items.map(item => item.id)
		).toEqual(expected)
	expect(
		(await resolver.getListColumns(ctx, 30)).map(node => node.id)
	).not.toContain(39)
	await expect(
		resolver.getListPage(ctx, {
			node_id: 30,
			filters: [{ node_id: 36, operator: 'gt', value: 'true' }]
		})
	).rejects.toThrow('Boolean filters')
	await expect(
		resolver.getListPage(ctx, {
			node_id: 30,
			filters: [{ node_id: 37, operator: 'equals', value: 'yesterday' }]
		})
	).rejects.toThrow('ISO date')
})
