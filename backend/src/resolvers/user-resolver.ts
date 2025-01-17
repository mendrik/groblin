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

@ObjectType()
export class ProjectUser {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => String)
	email: string

	@Field(type => Boolean)
	confirmed: boolean

	/*
	@Field(type => [String])
	roles: string[]
	*/
}

@InputType()
export class Invite {
	@Field(type => String)
	email: string
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

	@Query(returns => [ProjectUser])
	async getUsers(@Ctx() ctx: Context): Promise<ProjectUser[]> {
		const { user } = ctx
		return this.db
			.selectFrom('user')
			.innerJoin('project_user', 'project_user.user_id', 'user.id')
			.select(['id', 'name', 'email', 'project_user.confirmed'])
			.where('project_id', '=', user.lastProjectId)
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
		@Arg('data', () => Invite) email: Invite
	): Promise<boolean> {
		this.pubSub.publish(Topic.UsersUpdated)
		return true
	}
}
