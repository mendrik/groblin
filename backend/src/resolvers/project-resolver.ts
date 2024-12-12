import { failOn } from '@shared/utils/guards.ts'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { isNil } from 'ramda'
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
	Query,
	Resolver,
	UseMiddleware
} from 'type-graphql'
import { LoggedInUser } from './auth-resolver.ts'
import { Node, NodeResolver } from './node-resolver.ts'
import { NodeSettings, NodeSettingsResolver } from './node-settings-resolver.ts'
import { Value, ValueResolver } from './value-resolver.ts'

@ObjectType()
export class Project {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string
}

@ObjectType()
export class ProjectData {
	@Field(type => Project)
	project: Project

	@Field(type => LoggedInUser)
	user: LoggedInUser

	@Field(type => [Node])
	nodes: Node[]

	@Field(type => [Value])
	values: Value[]

	@Field(type => [NodeSettings])
	nodeSettings: NodeSettings[]
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ProjectResolver {
	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	@inject(ValueResolver)
	private valueResolver: ValueResolver

	@inject(NodeSettingsResolver)
	private nodeSettingsResolver: NodeSettingsResolver

	@inject(Kysely)
	private db: Kysely<DB>

	@Query(returns => ProjectData)
	async getProject(@Ctx() ctx: Context): Promise<ProjectData> {
		const nodes = await this.nodeResolver.getNodes(ctx)
		const values = await this.valueResolver.getValues({ ids: [] }, ctx)
		const nodeSettings = await this.nodeSettingsResolver.getNodeSettings(ctx)

		const project = await this.db
			.selectFrom('project')
			.selectAll()
			.where('id', '=', ctx.user.lastProjectId)
			.executeTakeFirst()
			.then(failOn(isNil, 'Project not found'))

		return {
			project,
			nodes: nodes as Node[],
			values,
			user: ctx.user,
			nodeSettings
		}
	}
}
