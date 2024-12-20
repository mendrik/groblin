import {} from '@shared/utils/list-to-tree.ts'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import {} from 'ramda'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import type { Context } from 'src/types.ts'
import { Role } from 'src/types.ts'
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

	@Field(type => String)
	name: string

	@Field(type => Int)
	order: number

	@Field(type => [Value])
	children: Value[]
}

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
		console.log('getListItems', request)

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
			.selectAll('v')
			.select(['v2.value as child_value', 'v2.node_id as child_node_id'])
			.execute()
			.then(console.log)
		return []
	}
}
