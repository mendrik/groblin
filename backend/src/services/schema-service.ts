import {
	type GraphQLSchemaWithContext,
	type YogaInitialContext,
	createSchema
} from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import type { ProjectId, TreeNode } from 'src/types.ts'

function* typeDefs(node: TreeNode) {}

@injectable()
export class SchemaService {
	@inject(NodeResolver)
	private readonly nodeResolver: NodeResolver

	async getSchema(
		projectId: ProjectId
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
		const root = await this.nodeResolver.getTreeNode(projectId)

		const schema = createSchema({
			typeDefs: /* GraphQL */ `
                            type Query {
                                greetings: String!
                            }
                        `,
			resolvers: {
				Query: {
					greetings: () => 'Hello World!'
				}
			}
		})

		return schema
	}
}
