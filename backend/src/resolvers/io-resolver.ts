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
	InputType,
	Int,
	Mutation,
	Resolver,
	UseMiddleware
} from 'type-graphql'

@InputType()
export class JsonArrayImportInput {
	@Field(type => Int)
	node_id: number

	@Field(type => Int)
	data: number

	@Field(type => String)
	external_id: string

	@Field(type => String)
	structure: boolean
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class IoResolver {
	@Mutation(returns => Boolean)
	async importArray(
		@Arg('data', () => JsonArrayImportInput) data: JsonArrayImportInput,
		@Ctx() { db, extra: user, pubSub }: Context
	) {
		console.log('import array', data)
		pubSub.publish(Topic.NodesUpdated, true)
		pubSub.publish(Topic.ValuesUpdated, true)
		return true
	}
}
