import { GraphQLObjectType, GraphQLString } from 'graphql'
import { injectable } from 'inversify'
import { isEmpty, pluck } from 'ramda'
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

const ValueType = new GraphQLObjectType({
	name: 'Value',
	fields: {
		name: { type: GraphQLString }
	}
})

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

	@Field(type => ValueType)
	value: JsonValue
}

@InputType()
export class SelectedListItem {
	@Field(type => Int)
	id: number
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
		@Arg('listItems', () => [SelectedListItem])
		items: SelectedListItem[],
		@Ctx() { db, extra: user }: Context
	): Promise<Value[]> {
		return isEmpty(items)
			? db
					.selectFrom('values')
					.distinctOn('node_id')
					.where('project_id', '=', user.lastProjectId)
					.orderBy(['node_id', 'order'])
					.selectAll()
					.execute()
			: db
					.selectFrom('values')
					.where('project_id', '=', user.lastProjectId)
					.where('parent_value_id', 'in', pluck('id', items))
					.selectAll()
					.execute()
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
