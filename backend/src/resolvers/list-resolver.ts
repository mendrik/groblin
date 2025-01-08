import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import { toDate } from 'date-fns'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { propEq, reject } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty, spreadProp } from 'ramda-adjunct'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Role } from 'src/types.ts'
import {
	Arg,
	Authorized,
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

const fixDates = {
	updated_at: toDate,
	children: { updated_at: toDate }
} as const

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ListResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@Query(returns => [ListItem])
	async getListItems(
		@Arg('request', () => ListRequest) request: ListRequest
	): Promise<ListItem[]> {
		const result = await this.db
			.selectFrom('values as v')
			.select([sql`to_jsonb(v.*)`.as('v'), sql`jsonb_agg(v2.*)`.as('children')])
			.innerJoin('values as v2', join =>
				join.on(sql`v2.list_path = array_append(v.list_path, v.id)`)
			)
			.leftJoin('node as n', 'v2.node_id', 'n.id')
			.$if(isNilOrEmpty(request.list_path), qb =>
				qb.where('v.list_path', 'is', null)
			)
			.$if(isNotNilOrEmpty(request.list_path), qb =>
				qb.where('v.list_path', '=', sql.val(request.list_path))
			)
			.where('v.node_id', '=', request.node_id)
			.groupBy('v.id')
			.orderBy('v.order', 'asc')
			.execute()

		return result
			.map(spreadProp('v'))
			.map<unknown>(evolveAlt(fixDates)) as ListItem[]
	}

	@Query(returns => [Node])
	async getListColumns(@Arg('node_id', () => Int) node_id: number) {
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
			.where(
				sql`COALESCE(ns.settings ->> 'hideColumnHead', 'false')`,
				'=',
				false
			)
			.orderBy('order')
			.orderBy('depth')
			.limit(8)
			.execute()
			.then(reject(propEq(node_id, 'id')))
	}
}
