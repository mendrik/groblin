import { listRequestSchema } from '@shared/list-query.ts'
import { parseNodeSettings } from '@shared/node-settings.ts'
import { GraphQLError } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely, type RawBuilder, sql } from 'kysely'
import { z } from 'zod'
import type { DB } from '../database/schema.ts'
import type { ListPage, ListRequest, Value } from '../gql/schema.ts'
import { requireListPath, requireNode } from '../security/project-access.ts'
import { type Context, NodeType } from '../types.ts'
import { parseNode } from '../utils/parse-node.ts'

export type { ListItem, ListRequest } from '../gql/schema.ts'

const requestSchema = listRequestSchema satisfies z.ZodType<ListRequest>
const valueSchema = z.object({
	id: z.int().positive(),
	node_id: z.int().positive(),
	revision: z.int().positive(),
	order: z.int(),
	list_path: z.array(z.int().positive()).nullable(),
	value: z.record(z.string(), z.json()).nullable(),
	updated_at: z.coerce.date()
}) satisfies z.ZodType<Value>
const itemSchema = valueSchema.extend({ children: z.array(valueSchema) })
const invalid = (message: string): never => {
	throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}

@injectable()
export class ListResolver {
	@inject(Kysely) private db: Kysely<DB>

	private async fields(db: Kysely<DB>, projectId: number, nodeId: number) {
		const target = await requireNode(db, projectId, nodeId)
		if (target.type !== NodeType.list) return invalid('Choose a list')
		const nodes = await db
			.selectFrom('node')
			.selectAll()
			.where('project_id', '=', projectId)
			.orderBy('depth')
			.orderBy('order')
			.orderBy('id')
			.execute()
			.then(rows => rows.map(parseNode))
		const byId = new Map(nodes.map(node => [node.id, node]))
		return nodes.filter(node => {
			if ([NodeType.root, NodeType.object, NodeType.list].includes(node.type))
				return false
			let parentId = node.parent_id
			const visited = new Set<number>()
			while (parentId !== null) {
				if (parentId === nodeId) return true
				if (visited.has(parentId)) return false
				visited.add(parentId)
				const parent = byId.get(parentId)
				if (!parent || parent.type === NodeType.list) return false
				parentId = parent.parent_id
			}
			return false
		})
	}

	async getListPage(ctx: Context, request: ListRequest): Promise<ListPage> {
		const input = requestSchema.parse(request)
		return this.db
			.transaction()
			.setIsolationLevel('repeatable read')
			.execute(async db => {
				const fields = await this.fields(db, ctx.project_id, input.node_id)
				await requireListPath(
					db,
					ctx.project_id,
					input.node_id,
					input.list_path
				)
				const byId = new Map(fields.map(node => [node.id, node]))
				const expression = (nodeId: number): RawBuilder<string> => {
					if (nodeId === input.node_id) return sql<string>`v.value ->> 'name'`
					const node = byId.get(nodeId)
					if (!node)
						return invalid(
							'Filter and sort fields must belong to this list scope'
						)
					const property = new Map<NodeType, string>([
						[NodeType.string, 'content'],
						[NodeType.article, 'content'],
						[NodeType.number, 'figure'],
						[NodeType.boolean, 'state'],
						[NodeType.choice, 'selected'],
						[NodeType.date, 'date'],
						[NodeType.media, 'name'],
						[NodeType.color, 'rgba']
					]).get(node.type)
					if (!property) return invalid('This field cannot be filtered')
					return sql<string>`(SELECT c.value ->> ${property} FROM "values" c WHERE c.project_id = v.project_id AND c.node_id = ${nodeId} AND coalesce(c.list_path, '{}'::integer[]) = array_append(coalesce(v.list_path, '{}'::integer[]), v.id) ORDER BY c.id LIMIT 1)`
				}
				let query = db
					.selectFrom('values as v')
					.selectAll('v')
					.where('v.project_id', '=', ctx.project_id)
					.where('v.node_id', '=', input.node_id)
					.where(
						sql<boolean>`coalesce(v.list_path, '{}'::integer[]) = ${input.list_path ?? []}::integer[]`
					)
				if (input.search)
					query = query.where(
						sql<boolean>`(strpos(lower(coalesce(v.value ->> 'name', '')), lower(${input.search})) > 0 OR EXISTS (SELECT 1 FROM "values" s WHERE s.project_id = v.project_id AND coalesce(s.list_path, '{}'::integer[]) = array_append(coalesce(v.list_path, '{}'::integer[]), v.id) AND s.node_id = ANY(${fields.map(node => node.id)}::integer[]) AND strpos(lower(s.value::text), lower(${input.search})) > 0))`
					)
				for (const filter of input.filters ?? []) {
					const field = expression(filter.node_id)
					if (filter.operator === 'exists' || filter.operator === 'missing') {
						query = query.where(
							field,
							filter.operator === 'exists' ? 'is not' : 'is',
							null
						)
						continue
					}
					if (filter.value == null) return invalid('A filter value is required')
					const type = byId.get(filter.node_id)?.type ?? NodeType.string
					if (filter.operator === 'contains') {
						if (
							[NodeType.number, NodeType.boolean, NodeType.color].includes(type)
						)
							return invalid('Contains requires a text field')
						query = query.where(
							sql<boolean>`strpos(lower(${field}), lower(${filter.value})) > 0`
						)
						continue
					}
					const operator = (
						{ equals: '=', gt: '>', gte: '>=', lt: '<', lte: '<=' } as const
					)[filter.operator]
					if (type === NodeType.number) {
						const number = Number(filter.value)
						if (!filter.value.trim() || !Number.isFinite(number))
							return invalid('Enter a finite number for this filter')
						query = query.where(
							sql<number>`(${field})::numeric`,
							operator,
							number
						)
					} else if (type === NodeType.boolean) {
						if (
							filter.operator !== 'equals' ||
							!['true', 'false'].includes(filter.value)
						)
							return invalid('Boolean filters require equals true or false')
						query = query.where(field, '=', filter.value)
					} else {
						if (
							type === NodeType.date &&
							!z
								.union([z.iso.date(), z.iso.datetime({ offset: true })])
								.safeParse(filter.value).success
						)
							return invalid('Enter an ISO date for this filter')
						query =
							type === NodeType.date
								? query.where(
										sql`(${field})::timestamptz`,
										operator,
										filter.value
									)
								: query.where(field, operator, filter.value)
					}
				}
				const count = await query
					.clearSelect()
					.select(({ fn }) => fn.countAll<string>('v').as('total'))
					.executeTakeFirstOrThrow()
				const direction = input.direction ?? 'asc'
				const limit = input.limit ?? 25,
					offset = input.offset ?? 0
				let sorted = query
				if (input.sort_node_id) {
					const field = expression(input.sort_node_id)
					const type = byId.get(input.sort_node_id)?.type
					sorted = sorted.orderBy(
						type === NodeType.number
							? sql`(${field})::numeric`
							: type === NodeType.date
								? sql`(${field})::timestamptz`
								: field,
						direction
					)
				} else sorted = sorted.orderBy('v.order', direction)
				const rows = await sorted
					.orderBy('v.id', direction)
					.limit(limit)
					.offset(offset)
					.select(
						sql`COALESCE((SELECT jsonb_agg(c.* ORDER BY c."order", c.id) FROM "values" c WHERE c.project_id = v.project_id AND coalesce(c.list_path, '{}'::integer[]) = array_append(coalesce(v.list_path, '{}'::integer[]), v.id)), '[]'::jsonb)`.as(
							'children'
						)
					)
					.execute()
				return {
					items: z.array(itemSchema).parse(rows),
					total: Number(count.total),
					limit,
					offset
				}
			})
	}

	async getListItems(ctx: Context, request: ListRequest) {
		return (await this.getListPage(ctx, request)).items
	}

	async getListColumns(ctx: Context, nodeId: number) {
		const fields = await this.fields(this.db, ctx.project_id, nodeId)
		const settings = await this.db
			.selectFrom('node_settings')
			.select(['node_id', 'settings'])
			.where('project_id', '=', ctx.project_id)
			.execute()
		const byId = new Map(settings.map(row => [row.node_id, row.settings]))
		return fields.filter(
			node => !parseNodeSettings(node.type, byId.get(node.id)).hideColumnHead
		)
	}
}
