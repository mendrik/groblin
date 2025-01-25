import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import { toDate } from 'date-fns'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { propEq, reject } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { type Context, type ProjectId, Role } from 'src/types.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	ObjectType,
	Query,
	Resolver,
	UseMiddleware
} from 'type-graphql'
import { Node } from './node-resolver.ts'
import { Value } from './value-resolver.ts'

@InputType()
export class ListRequest {
	@Field(type => Int)
	node_id: number

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null
}

@ObjectType()
export class ListItem extends Value {
	@Field(type => [Value])
	children: Value[]
}

const renameMap = {
	child_id: 'id',
	child_node_id: 'node_id',
	child_value: 'value',
	child_order: 'order',
	child_updated_at: 'updated_at',
	child_list_path: 'list_path'
} as const

// we need this because json_agg bypassed kysely's column type handlers
const fixDates = { children: { updated_at: toDate } } as const

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ListResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	async listItems(
		projectId: ProjectId,
		request: ListRequest
	): Promise<ListItem[]> {
		const result = await this.db
			.selectFrom('values as v')
			.selectAll('v')
			.select(sql`jsonb_agg(v2.*)`.as('children'))
			.innerJoin('values as v2', join =>
				join.on(sql`v2.list_path = array_append(v.list_path, v.id)`)
			)
			.leftJoin('node as n', 'v2.node_id', 'n.id')
			.$if(isNilOrEmpty(request.list_path), qb =>
				qb.where(eb =>
					eb.or([
						eb('v.list_path', 'is', null),
						eb('v.list_path', '=', sql.val([]))
					])
				)
			)
			.$if(isNotNilOrEmpty(request.list_path), qb =>
				qb.where('v.list_path', '=', sql.val(request.list_path))
			)
			.where('v.node_id', '=', request.node_id)
			.where('v.project_id', '=', projectId)
			.groupBy('v.id')
			.orderBy('v.order', 'asc')
			.execute()

		return result.map<unknown>(evolveAlt(fixDates)) as ListItem[]
	}

	@Query(returns => [ListItem])
	async getListItems(
		@Ctx() ctx: Context,
		@Arg('request', () => ListRequest) request: ListRequest
	): Promise<ListItem[]> {
		return this.listItems(ctx.user.lastProjectId, request)
	}

	@Query(returns => [Node])
	async getListColumns(
		@Ctx() ctx: Context,
		@Arg('node_id', () => Int) node_id: number
	) {
		return this.db
			.withRecursive('node_tree', qb =>
				qb
					.selectFrom('node')
					.where('node.id', '=', node_id)
					.selectAll('node')
					.unionAll(qb =>
						qb
							.selectFrom('node as n')
							.innerJoin('node_tree as nt', 'n.parent_id', 'nt.id')
							.selectAll('n')
					)
			)
			.selectFrom('node_tree')
			.selectAll('node_tree')
			.leftJoin('node_settings as ns', 'node_tree.id', 'ns.node_id')
			.where(eb =>
				eb.and([
					eb(
						sql`COALESCE(ns.settings ->> 'hideColumnHead', 'false')`,
						'=',
						false
					),
					eb('node_tree.type', 'not in', ['List', 'Object']),
					eb('node_tree.project_id', '=', ctx.user.lastProjectId)
				])
			)
			.orderBy('depth')
			.orderBy('order')
			.limit(8)
			.execute()
			.then(reject(propEq(node_id, 'id')))
	}
}
