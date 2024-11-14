import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import { Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
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
	tag_id: number

	@Field(type => Int)
	project_id: number
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
		@Arg('tagId', () => Int) tagId: number,
		@Ctx() { db, extra: user }: Context
	) {
		return db
			.selectFrom('value')
			.where('project_id', '=', user.lastProjectId)
			.where('tag_id', '=', tagId)
			.selectAll()
			.execute()
	}
}
