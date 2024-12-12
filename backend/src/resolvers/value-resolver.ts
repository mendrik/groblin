import {} from 'graphql'
import { GraphQLJSONObject } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { Context } from 'src/context.ts'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/services/pubsub-service.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	type PubSub,
	Query,
	Resolver,
	Subscription,
	UseMiddleware
} from 'type-graphql'
import { matchesLastProject } from './utils.ts'

@ObjectType()
export class Value {
	@Field(type => Int)
	id: number

	@Field(type => Int)
	node_id: number

	@Field(type => Int)
	order: number

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null

	@Field(type => GraphQLJSONObject)
	value: JsonValue
}

@InputType()
export class UpsertValue {
	@Field(type => Int, { nullable: true })
	id?: number

	@Field(type => Int)
	node_id: number

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null

	@Field(type => GraphQLJSONObject)
	value: JsonValue
}

@InputType()
export class GetValues {
	@Field(type => [Int], { nullable: false })
	ids: number[]
}

@InputType()
export class InsertListItem {
	@Field(type => String)
	name: string

	@Field(type => Int)
	node_id: number

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ValueResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Subscription(returns => Boolean, {
		topics: Topic.ValuesUpdated,
		filter: matchesLastProject
	})
	valuesUpdated(@Arg('projectId', () => Int) _: number) {
		return true
	}

	@Query(returns => [Value])
	async getValues(
		@Arg('data', () => GetValues) { ids }: GetValues,
		@Ctx() ctx: Context
	): Promise<Value[]> {
		const { user } = ctx
		return this.db
			.selectFrom('values')
			.where('project_id', '=', user.lastProjectId)
			.where(({ or, eb }) =>
				or([eb('list_path', '<@', [ids]), eb('list_path', 'is', null)])
			)
			.orderBy(['node_id', 'order'])
			.selectAll()
			.execute()
	}

	@Mutation(returns => Int)
	async insertListItem(
		@Arg('listItem', () => InsertListItem) data: InsertListItem,
		@Ctx() ctx: Context
	) {
		const { user } = ctx
		const { max_order } = await this.db
			.selectFrom('values') // Replace with your table name
			.where('node_id', '=', data.node_id)
			.select(this.db.fn.max('order').as('max_order')) // Replace with your column name
			.executeTakeFirstOrThrow()

		const res = await this.db
			.insertInto('values')
			.values({
				node_id: data.node_id,
				project_id: user.lastProjectId,
				value: { name: data.name },
				list_path: data.list_path,
				order: max_order + 1
			})
			.returning('id as id')
			.executeTakeFirstOrThrow()

		this.pubSub.publish(Topic.ValuesUpdated, true)
		return res.id
	}

	@Mutation(returns => Boolean)
	async deleteListItem(@Arg('id', () => Int) id: number, @Ctx() ctx: Context) {
		const { user } = ctx
		const { numDeletedRows } = await this.db
			.transaction()
			.execute(async trx => {
				await trx
					.deleteFrom('values')
					.where('list_path', '&&', [[id]])
					.execute()

				return await trx
					.deleteFrom('values')
					.where('id', '=', id)
					.executeTakeFirstOrThrow()
			})

		this.pubSub.publish(Topic.ValuesUpdated, true)
		return numDeletedRows > 0
	}

	@Mutation(returns => Int)
	async upsertValue(
		@Arg('data', () => UpsertValue) data: UpsertValue,
		@Ctx() ctx: Context
	) {
		const { user } = ctx
		const { id } = await this.db
			.insertInto('values')
			.values({
				id: data.id,
				node_id: data.node_id,
				project_id: user.lastProjectId,
				value: data.value,
				list_path: data.list_path
			})
			.onConflict(c =>
				c.column('id').doUpdateSet(e => ({
					value: e.ref('excluded.value')
				}))
			)
			.returning('id as id')
			.executeTakeFirstOrThrow()
		this.pubSub.publish(Topic.ValuesUpdated, true)
		return id
	}
}
