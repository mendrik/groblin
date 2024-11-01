import { Role } from '@shared/enums.ts'
import { inject, injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import {
	Authorized,
	Ctx,
	Field,
	ObjectType,
	Query,
	Resolver,
	UseMiddleware
} from 'type-graphql'
import { Node, NodeResolver } from './node-resolver.ts'
import { Tag, TagResolver } from './tag-resolver.ts'

@ObjectType()
export class Project {
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

	@Query(returns => Project)
	async getProject(@Ctx() ctx: Context) {
		const nodes = await this.nodeResolver.getNodes(ctx)
		const tags = await this.tagResolver.getTags(ctx)
		return {
			nodes,
			tags
		}
	}
}
