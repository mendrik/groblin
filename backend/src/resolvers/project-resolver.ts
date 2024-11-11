import { Role } from '@shared/enums.ts'
import { failOn } from '@shared/utils/guards.ts'
import { inject, injectable } from 'inversify'
import { isNil } from 'ramda'
import type { Context } from 'src/context.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
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
import { AuthResolver, LoggedInUser } from './auth-resolver.ts'
import { Node, NodeResolver } from './node-resolver.ts'
import { Tag, TagResolver } from './tag-resolver.ts'

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

	@Field(type => [Tag])
	tags: Tag[]
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ProjectResolver {
	@inject(NodeResolver)
	private readonly nodeResolver: NodeResolver

	@inject(TagResolver)
	private readonly tagResolver: TagResolver

	@inject(AuthResolver)
	private readonly authResolver: AuthResolver

	@Query(returns => ProjectData)
	async getProject(@Ctx() ctx: Context) {
		const nodes = await this.nodeResolver.getNodes(ctx)
		const tags = await this.tagResolver.getTags(ctx)

		const project = await ctx.db
			.selectFrom('project')
			.selectAll()
			.where('id', '=', ctx.extra.lastProjectId)
			.executeTakeFirst()
			.then(failOn(isNil, 'Project not found'))

		return {
			project,
			nodes,
			user: ctx.extra,
			tags
		}
	}
}
