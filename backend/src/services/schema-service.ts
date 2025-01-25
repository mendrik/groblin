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
import type { GraphQLSchemaWithContext, YogaInitialContext } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { T as _, isNotNil, mergeAll, prop, propEq, propOr } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB, JsonObject, JsonValue } from 'src/database/schema.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import { NodeType, type ProjectId, type TreeNode } from 'src/types.ts'
import { allNodes } from 'src/utils/nodes.ts'
import { WhereObjectScalar } from 'src/utils/where-scalar.ts'

type Fields<S, C, A> = ThunkObjMap<GraphQLFieldConfig<S, C, A>>

type Settings = Map<number, NodeSettings>

const scalarForNode = match<[TreeNode, TypeContext], GraphQLScalarType | null>(
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

const resolve2 = match<[TreeNode, any, any, any], Promise<JsonValue>>(
	caseOf([{ type: NodeType.string }, _, _, _], async node => node.name),
	caseOf([{ type: NodeType.article }, _, _, _], async node => node.name)
)

const isRequired = (nodeId: number, context: TypeContext) => {
	const settingsValue = context.settings.get(nodeId)?.settings
	return propOr(false, 'required', settingsValue)
}

async function* fieldsFor<S, C, A>(
	parent: TreeNode,
	context: TypeContext
): AsyncGenerator<Fields<S, C, A>> {
	for (const node of parent.nodes) {
		const type = scalarForNode(node, context)
		if (type) {
			yield {
				[node.name]: {
					type: isRequired(node.id, context) ? new GraphQLNonNull(type) : type,
					resolve: (source, args, ctx, _info) =>
						resolve2(node, source, args, ctx)
				}
			}
		}
	}
}

type NamedQuery<S, C> = Record<string, GraphQLFieldConfig<S, C>>

async function* listNodeQuery<S, C>(
	node: TreeNode,
	context: TypeContext
): AsyncGenerator<NamedQuery<S, C>> {
	const innerType = new GraphQLList(
		context.types.get(node.id)?.type as GraphQLObjectType
	)
	yield {
		[node.name]: {
			type: innerType as GraphQLOutputType,
			args: {
				whereEq: { type: WhereObjectScalar },
				whereNotEq: { type: WhereObjectScalar },
				limit: { type: GraphQLFloat }
			},
			resolve: (
				source: S,
				args: { where: JsonObject },
				context: C,
				info: GraphQLResolveInfo
			) => []
		}
	}
}

async function* objectNodeQuery<S, C, TArgs>(
	node: TreeNode,
	context: TypeContext
): AsyncGenerator<NamedQuery<S, C>> {
	const type = context.types.get(node.id)?.type as GraphQLObjectType
	yield {
		[node.name]: {
			type,
			resolve: () => queriesFromNodes(node.nodes, context)
		}
	}
}

async function* queriesFromNodes<S, C, TArgs>(
	parents: TreeNode[],
	context: TypeContext
): AsyncGenerator<NamedQuery<S, C>> {
	for (const node of parents) {
		yield* match<
			[TreeNode, TypeContext],
			AsyncGenerator<Record<string, GraphQLFieldConfig<S, C, TArgs>>>
		>(
			caseOf([{ type: NodeType.list }, _], listNodeQuery),
			caseOf([{ type: NodeType.object }, _], objectNodeQuery)
		)(node, context)
	}
}

async function* typesFromNodes<S, C, TArgs>(
	parents: TreeNode[],
	context: TypeContext
): AsyncGenerator<GraphQLType> {
	for (const node of parents) {
		const fields = await toArray(fieldsFor(node, context)).then<
			Fields<S, C, TArgs>
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

class TypeContext {
	settings: Settings
	types: Map<number, NodeGraphQLType>
	db: Kysely<DB>
	constructor(settings: Settings, db: Kysely<DB>) {
		this.settings = settings
		this.types = new Map()
		this.db = db
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
		const context = new TypeContext(settings, this.db)
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
