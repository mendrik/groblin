import { injectable } from 'inversify'
import { pluck } from 'ramda'
import type { Context } from 'src/context.ts'
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
	project_id: number
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
		@Arg('listItems', () => [SelectedListItem]) items: SelectedListItem[],
		@Ctx() { db, extra: user }: Context
	) {
		return db
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
