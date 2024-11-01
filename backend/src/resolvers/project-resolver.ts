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
import { Node, type NodeResolver } from './node-resolver.ts'

@ObjectType()
export class Project {
	@Field(type => [Node])
	nodes: Node[]
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class ProjectResolver {
	@inject('NodeResolver')
	private readonly nodeResolver: NodeResolver

	@Query(returns => Project)
	async getNodes(@Ctx() ctx: Context) {
		const nodes = await this.nodeResolver.getNodes(ctx)
		return {
			nodes
		}
	}
}
