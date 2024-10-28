import { Node } from '@shared/models/node.js'
import { Query, Resolver } from 'type-graphql'

@Resolver()
export class NodeResolver {
	@Query(returns => [Node])
	async nodes() {
		return []
	}
}
