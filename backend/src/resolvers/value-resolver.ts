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

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ValueResolver {
	@Subscription(returns => Boolean, {
		topics: Topic.ValuesUpdated,
		filter: matchesLastProject
	})
	valuesUpdated(@Arg('lastProjectId', () => Int) _: number) {
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
			.where('list_item_id', 'in', pluck('id', items))
			.selectAll()
			.execute()
	}
}
