import {} from '@shared/utils/list-to-tree.ts'
import { GraphQLJSONObject } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import {} from 'ramda'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import type { Context } from 'src/types.ts'
import { Role } from 'src/types.ts'
import { mergeProps } from 'src/utils/merge-props.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	ObjectType,
	type PubSub,
	Query,
	Resolver,
	UseMiddleware
} from 'type-graphql'

@InputType()
export class ListRequest {
	@Field(type => Int)
	node_id: number

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null
}

@ObjectType()
export class ChildValue {
	@Field(type => Int)
	node_id: number | null

	@Field(type => GraphQLJSONObject)
	value: JsonValue
}

@ObjectType()
export class ListItem {
	@Field(type => Int)
	id: number

	@Field(type => GraphQLJSONObject)
	value: JsonValue

	@Field(type => Int)
	order: number

	@Field(type => [ChildValue])
	children: ChildValue[]
}

const renameMap = { child_value: 'value', child_node_id: 'node_id' } as const

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
		@Arg('request', () => ListRequest) request: ListRequest,
		@Ctx() ctx: Context
	): Promise<ListItem[]> {
		const { user } = ctx
		const result = await this.db
			.selectFrom('values as v')
			.leftJoin('values as v2', j =>
				j.on(sql`v2.list_path = array_append(v.list_path, v.id)`)
			)
			.leftJoin('node as n', 'v2.node_id', 'n.id')
			.leftJoin('node_settings as ns', 'n.id', 'ns.node_id')
			.where('v.list_path', '=', sql.val(request.list_path ?? null))
			.where('v.node_id', '=', request.node_id)
			.groupBy(['v.id', 'v2.id', 'n.order', 'n.depth'])
			.orderBy('v2.list_path')
			.orderBy('n.order')
			.orderBy('n.depth')
			.select([
				'v.id',
				'v.value',
				'v.order',
				'v2.value as child_value',
				'v2.node_id as child_node_id'
			])
			.execute()
		return mergeProps('id', renameMap, 'children', result)
	}
}
