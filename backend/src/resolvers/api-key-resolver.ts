import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import type { Context } from 'src/types.ts'
import { Role } from 'src/types.ts'
import {
	Authorized,
	Ctx,
	Field,
	Int,
	ObjectType,
	type PubSub,
	Query,
	Resolver,
	UseMiddleware
} from 'type-graphql'

@ObjectType()
export class ApiKey {
	@Field(type => Date)
	created_at: Date

	@Field(type => Date, { nullable: true })
	expires_at: Date | null

	@Field(type => Boolean)
	is_active: boolean

	@Field(type => String)
	key: string

	@Field(type => Date, { nullable: true })
	last_used: Date | null

	@Field(type => String)
	name: string

	@Field(type => Int)
	project_id: number
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin)
@Resolver()
export class ApiKeyResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Query(returns => [ApiKey])
	async getApiKeys(@Ctx() ctx: Context): Promise<ApiKey[]> {
		const { user } = ctx
		return this.db
			.selectFrom('api_key')
			.where('project_id', '=', user.lastProjectId)
			.selectAll()
			.execute()
	}
}
