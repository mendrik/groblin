import { GraphQLJSONObject } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { propEq, reject } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Role } from 'src/types.ts'
import { mergeProps } from 'src/utils/merge-props.ts'
import {
	Arg,
	Authorized,
	Field,
	InputType,
	Int,
	ObjectType,
	type PubSub,
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
export class ListItem {
	@Field(type => Int)
	id: number

	@Field(type => Int)
	node_id: number

	@Field(type => GraphQLJSONObject)
	value: JsonValue

	@Field(type => Int)
	order: number

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null

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

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ListResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Query(returns => [ListItem])
	async getListItems(
		@Arg('request', () => ListRequest) request: ListRequest
	): Promise<ListItem[]> {
		const result = await this.db
			.selectFrom('values as v')
			.innerJoin('values as v2', j =>
				j.on(sql`v2.list_path = array_append(v.list_path, v.id)`)
			)
			.leftJoin('node as n', 'v2.node_id', 'n.id')
			.$if(isNilOrEmpty(request.list_path), qb =>
				qb.where('v.list_path', 'is', null)
			)
			.$if(isNotNilOrEmpty(request.list_path), qb =>
				qb.where('v.list_path', '=', sql.val(request.list_path))
			)
			.where('v.node_id', '=', request.node_id)
			.groupBy(['v.id', 'v2.id'])
			.orderBy('v.order')
			.select([
				'v.id',
				'v.value',
				'v.node_id',
				'v.list_path',
				'v.order',
				'v2.id as child_id',
				'v2.value as child_value',
				'v2.node_id as child_node_id',
				'v2.updated_at as child_updated_at',
				'v2.list_path as child_list_path',
				'v2.order as child_order'
			])
			.execute()
		return mergeProps('id', renameMap, 'children', result)
	}

	@Query(returns => [Node])
	async getListColumns(@Arg('node_id', () => Int) node_id: number) {
		const { coalesce, jsonAgg } = this.db.fn
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
