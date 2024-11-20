import {} from 'graphql'
import { GraphQLJSONObject } from 'graphql-scalars'
import { injectable } from 'inversify'
import { isEmpty } from 'ramda'
import type { Context } from 'src/context.ts'
import type { JsonValue } from 'src/database/schema.ts'
import { Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
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

	@Field(type => Int, { nullable: true })
	parent_value_id: number | null

	@Field(type => GraphQLJSONObject)
	value: JsonValue
}

@InputType()
export class InsertListItem {
	@Field(type => String)
	name: string

	@Field(type => Int)
	node_id: number

	@Field(type => Int, { nullable: true })
	parent_value_id?: number
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ValueResolver {
	@Subscription(returns => Boolean, {
		topics: Topic.ValuesUpdated,
		filter: matchesLastProject
	})
	valuesUpdated(@Arg('projectId', () => Int) _: number) {
		return true
	}

	@Query(returns => [Value])
	async getValues(
		@Arg('ids', () => [Int])
		ids: number[],
		@Ctx() { db, extra: user }: Context
	): Promise<Value[]> {
		const query = db
			.selectFrom('values')
			.where('project_id', '=', user.lastProjectId)
			.orderBy(['node_id', 'order'])
			.selectAll()

		isEmpty(ids)
			? query.distinctOn('node_id').where('parent_value_id', 'is', null)
			: query.where('parent_value_id', 'in', ids)

		return query.execute()
	}

	@Mutation(returns => Int)
	async insertListItem(
		@Arg('listItem', () => InsertListItem) data: InsertListItem,
		@Ctx() { db, extra: user, pubSub }: Context
	) {
		const res = await db
			.insertInto('values')
			.values({
				node_id: data.node_id,
				project_id: user.lastProjectId,
				value: { name: data.name },
				parent_value_id: data.parent_value_id
			})
			.returning('id as id')
			.executeTakeFirstOrThrow()

		pubSub.publish(Topic.ValuesUpdated, true)
		return res.id
	}
}
