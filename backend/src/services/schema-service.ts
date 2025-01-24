import { toArray } from '@shared/utils/async-generator.ts'
import { listToTree } from '@shared/utils/list-to-tree.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import type {
	GraphQLOutputType,
	GraphQLResolveInfo,
	GraphQLScalarType,
	GraphQLType
} from 'graphql'
import {
	GraphQLBoolean,
	type GraphQLFieldConfig,
	GraphQLFloat,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	type ThunkObjMap,
	printSchema
} from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'
import type { GraphQLSchemaWithContext, YogaInitialContext } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import {
	T as _,
	isNotNil,
	mergeAll,
	prop,
	propEq,
	propSatisfies as propIs,
	propOr
} from 'ramda'
import { included, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB } from 'src/database/schema.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import { NodeType, type ProjectId, type TreeNode } from 'src/types.ts'
import { allNodes } from 'src/utils/nodes.ts'

const isObjectNode = propIs(included([NodeType.object, NodeType.list]), 'type')

type Fields<TSource, TContext> = ThunkObjMap<
	GraphQLFieldConfig<TSource, TContext>
>

type Settings = Map<number, NodeSettings>

const scalarForNode = match<[TreeNode, Context], GraphQLScalarType | null>(
	caseOf([{ type: NodeType.string }], GraphQLString),
	caseOf([{ type: NodeType.boolean }], GraphQLBoolean),
	caseOf([{ type: NodeType.number }], GraphQLFloat),
	caseOf([{ type: NodeType.article }], GraphQLString),
	caseOf(
		[{ type: NodeType.object }],
		({ name }, { types }) => types.get(name)?.type
	),
	caseOf(
		[{ type: NodeType.list }],
		({ name }, { types }) => types.get(name)?.type
	),
	caseOf([_], null)
)

async function* fieldsFor<TSource, TContext>(
	parent: TreeNode,
	context: Context
): AsyncGenerator<Fields<TSource, TContext>> {
	for (const node of parent.nodes) {
		const type = scalarForNode(node, context)
		if (type) {
			const settingsValue = context.settings.get(node.id)?.settings
			const isRequired = propOr(false, 'required', settingsValue)
			yield {
				[node.name]: {
					type: isRequired ? new GraphQLNonNull(type) : type,
					resolve: () => null
				}
			}
		}
	}
}

type NamedQuery<TSource, TContext> = Record<
	string,
	GraphQLFieldConfig<TSource, TContext>
>

async function* listNodeQuery<TSource, TContext, TArgs>(
	node: TreeNode,
	context: Context
): AsyncGenerator<NamedQuery<TSource, TContext>> {
	const innerType = new GraphQLList(
		context.types.get(node.id)?.type as GraphQLObjectType
	)
	yield {
		[node.name]: {
			type: innerType as GraphQLOutputType,
			args: {
				where: { type: GraphQLJSON }
			},
			resolve: (
				source: TSource,
				args: TArgs,
				context: TContext,
				info: GraphQLResolveInfo
			) => []
		}
	}
}

async function* objectNodeQuery<TSource, TContext, TArgs>(
	node: TreeNode,
	context: Context
): AsyncGenerator<NamedQuery<TSource, TContext>> {
	const type = context.types.get(node.id)?.type as GraphQLObjectType
	yield {
		[node.name]: {
			type,
			resolve: (
				source: TSource,
				args: TArgs,
				context: TContext,
				info: GraphQLResolveInfo
			) => ({})
		}
	}
}

async function* queriesFromNodes<TSource, TContext, TArgs>(
	parents: TreeNode[],
	context: Context
): AsyncGenerator<NamedQuery<TSource, TContext>> {
	for (const node of parents) {
		yield* match<
			[TreeNode, Context],
			AsyncGenerator<
				Record<string, GraphQLFieldConfig<TSource, TContext, TArgs>>
			>
		>(
			caseOf([{ type: NodeType.list }, _], listNodeQuery),
			caseOf([{ type: NodeType.object }, _], objectNodeQuery)
		)(node, context)
	}
}

async function* typesFromNodes<TSource, TContext>(
	parents: TreeNode[],
	context: Context
): AsyncGenerator<GraphQLType> {
	for (const node of parents) {
		const fields = await toArray(fieldsFor(node, context)).then<
			Fields<TSource, TContext>
		>(mergeAll)

		if (isNotNilOrEmpty(fields)) {
			const type = new GraphQLObjectType({
				name: node.name,
				fields
			})
			const objectType =
				node.type === NodeType.list ? new GraphQLList(type) : type
			context.types.set(node.id, {
				type: objectType,
				node
			})
			yield objectType
		}
	}
}

type NodeGraphQLType = {
	type: GraphQLType
	node: TreeNode
}

class Context {
	settings: Settings
	types: Map<number, NodeGraphQLType>
	constructor(settings: Settings) {
		this.settings = settings
		this.types = new Map()
	}
}

// to make context.type lookup work we need to reverse the order of the nodes
const getNestingNodes = async (projectId: ProjectId, db: Kysely<DB>) => {
	const nodeTypeIds = await db
		.selectFrom('node')
		.select('id')
		.where('project_id', '=', projectId)
		.where(eb =>
			eb.or([eb('type', '=', NodeType.object), eb('type', '=', NodeType.list)])
		)
		.orderBy('depth', 'desc')
		.orderBy('order', 'desc')
		.execute()
	const nodes = await db
		.selectFrom('node')
		.where('project_id', '=', projectId)
		.selectAll()
		.execute()
	const root = listToTree('id', 'parent_id', 'nodes')(nodes) as TreeNode
	const treeNodes = [...allNodes(root)]
	const nodeMap = mapBy(prop('id'), treeNodes)
	return nodeTypeIds.map(({ id }) => nodeMap.get(id)).filter(isNotNil)
}

@injectable()
export class SchemaService {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject(NodeSettingsResolver)
	private readonly nodeSettingsResolver: NodeSettingsResolver

	async getSchema(
		projectId: ProjectId
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
		const nodes = await getNestingNodes(projectId, this.db)
		const settings = await this.nodeSettingsResolver
			.settings(projectId)
			.then(mapBy<NodeSettings, number>(({ node_id }) => node_id))
		const context = new Context(settings)
		const types = await toArray(typesFromNodes(nodes, context))
		const fields = await toArray(
			queriesFromNodes(nodes.filter(propEq(1, 'depth')), context)
		).then<ThunkObjMap<GraphQLFieldConfig<any, any>>>(mergeAll)

		const schema = new GraphQLSchema({
			types: types as any,
			query: new GraphQLObjectType({
				name: 'Query',
				fields
			})
		})

		console.log(printSchema(schema))

		return schema
	}
}
