import { toArray } from '@shared/utils/async-generator.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import {
	GraphQLBoolean,
	type GraphQLFieldConfig,
	GraphQLFloat,
	type GraphQLNamedType,
	GraphQLNonNull,
	GraphQLObjectType,
	type GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	type ThunkObjMap,
	printSchema
} from 'graphql'
import type { GraphQLSchemaWithContext, YogaInitialContext } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { T as _, mergeAll, propSatisfies as propIs, propOr } from 'ramda'
import { included, isNotNilOrEmpty } from 'ramda-adjunct'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import { NodeType, type ProjectId, type TreeNode } from 'src/types.ts'

const isObjectNode = propIs(included([NodeType.object, NodeType.list]), 'type')

type Fields<TSource, TContext> = ThunkObjMap<
	GraphQLFieldConfig<TSource, TContext>
>

type Settings = Map<number, NodeSettings>

const scalarForNode = match<[TreeNode], GraphQLScalarType | null>(
	caseOf([{ type: NodeType.string }], GraphQLString),
	caseOf([{ type: NodeType.boolean }], GraphQLBoolean),
	caseOf([{ type: NodeType.number }], GraphQLFloat),
	caseOf([_], null)
)

async function* fieldsFor<TSource, TContext>(
	parent: TreeNode,
	settings: Settings
): AsyncGenerator<Fields<TSource, TContext>> {
	for (const node of parent.nodes) {
		const type = scalarForNode(node)
		if (type) {
			const settingsValue = settings.get(node.id)?.settings
			const isRequired = propOr(false, 'required', settingsValue)
			yield {
				[node.name]: { type: isRequired ? new GraphQLNonNull(type) : type }
			}
		}
	}
}

async function* typesFromTree<TSource, TContext>(
	parent: TreeNode,
	settings: Settings
): AsyncGenerator<GraphQLNamedType> {
	const fields = await toArray(fieldsFor(parent, settings)).then<
		Fields<TSource, TContext>
	>(mergeAll)

	if (isNotNilOrEmpty(fields)) {
		yield new GraphQLObjectType({
			name: parent.name,
			fields
		})
	}

	const objectNodes = parent.nodes.filter(isObjectNode)
	for (const node of objectNodes) {
		yield* typesFromTree(node, settings)
	}
}

@injectable()
export class SchemaService {
	@inject(NodeResolver)
	private readonly nodeResolver: NodeResolver

	@inject(NodeSettingsResolver)
	private readonly nodeSettingsResolver: NodeSettingsResolver

	async getSchema(
		projectId: ProjectId
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
		const root = await this.nodeResolver.getTreeNode(projectId)
		const settings = await this.nodeSettingsResolver
			.settings(projectId)
			.then(mapBy<NodeSettings, number>(({ node_id }) => node_id))
		const types = await toArray(typesFromTree(root, settings))

		const schema = new GraphQLSchema({
			types: types,
			query: new GraphQLObjectType({
				name: 'Query',
				fields: {
					greeting: {
						type: GraphQLString,
						resolve: () => 'Hello, world!'
					}
				}
			})
		})

		console.log(printSchema(schema))

		return schema
	}
}
