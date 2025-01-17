import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { type Context, Role, Topic } from 'src/types.ts'

import {
	Arg,
	Authorized,
	Ctx,
	Field,
	Int,
	Mutation,
	ObjectType,
	type PubSub,
	Query,
	Resolver,
	Subscription,
	UseMiddleware
} from 'type-graphql'

@ObjectType()
export class User {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => String)
	email: string

	@Field(type => Boolean)
	confirmed: boolean
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin)
@Resolver()
export class UserResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Subscription(returns => Boolean, {
		topics: Topic.UsersUpdated
	})
	usersUpdated() {
		return true
	}

	@Query(returns => [User])
	async getUsers(@Ctx() ctx: Context): Promise<User[]> {
		const { user } = ctx
		return this.db
			.selectFrom('user')
			.leftJoin('project_user', 'project_user.user_id', 'user.id')
			.where('project_id', '=', user.lastProjectId)
			.select(['id', 'name', 'email', 'confirmed'])
			.orderBy('name', 'desc')
			.execute()
	}

	@Mutation(returns => Boolean)
	async deleteUser(
		@Ctx() ctx: Context,
		@Arg('id', () => Int) id: number
	): Promise<boolean> {
		const result = await this.db
			.deleteFrom('project_user')
			.where('user_id', '=', id)
			.where('project_id', '=', ctx.user.lastProjectId)
			.executeTakeFirstOrThrow()
		this.pubSub.publish(Topic.UsersUpdated)
		return result.numDeletedRows > 0
	}

	@Mutation(returns => Boolean)
	async inviteUser(
		@Ctx() ctx: Context,
		@Arg('email', () => String) email: string
	): Promise<boolean> {
		this.pubSub.publish(Topic.UsersUpdated)
		return true
	}
}
