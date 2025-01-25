import { toArray } from '@shared/utils/async-generator.ts'
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
import { T as _, mergeAll, propEq } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import type { JsonObject, JsonValue } from 'src/database/schema.ts'
import {
	type Context,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import { WhereObjectScalar } from 'src/utils/where-scalar.ts'
import { TypeContext } from './type-context.ts'

type Fields<S, C, A> = ThunkObjMap<GraphQLFieldConfig<S, C, A>>

const scalarForNode = match<[TreeNode, TypeContext], GraphQLScalarType | null>(
	caseOf([{ type: NodeType.string }], GraphQLString),
	caseOf([{ type: NodeType.boolean }], GraphQLBoolean),
	caseOf([{ type: NodeType.number }], GraphQLFloat),
	caseOf([{ type: NodeType.article }], GraphQLString),
	caseOf([{ type: NodeType.color }], GraphQLString),
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

const resolveNode = match<[TreeNode, TypeContext, any], Promise<JsonValue>>(
	caseOf([{ type: NodeType.string }, _, _], (node, ctx) => ctx.getValue(node)),
	caseOf([{ type: NodeType.article }, _, _], async node => node.name)
)

async function* fieldsFor<S, C, A>(
	parent: TreeNode,
	context: TypeContext
): AsyncGenerator<Fields<S, C, A>> {
	for (const node of parent.nodes) {
		const type = scalarForNode(node, context)
		const required = await context.isRequired(node.id)

		if (type) {
			yield {
				[node.name]: {
					type: required ? new GraphQLNonNull(type) : type,
					resolve: (_source, args, _ctx, _info) =>
						resolveNode(node, context, args)
				}
			}
		}
	}
}

type NamedQuery<S, C> = Record<string, GraphQLFieldConfig<S, C>>

async function* listNodeQuery<S>(
	node: TreeNode,
	context: TypeContext
): AsyncGenerator<NamedQuery<S, Context>> {
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
			resolve: async (
				source: S,
				args: { where: JsonObject },
				ctx: Context,
				info: GraphQLResolveInfo
			) => {
				const listItems = await context.listItems({
					node_id: node.id,
					list_path: []
				})
				return []
			}
		}
	}
}

async function* objectNodeQuery<S, C>(
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

async function* queriesFromNodes<S>(
	parents: TreeNode[],
	context: TypeContext
): AsyncGenerator<NamedQuery<S, Context>> {
	for (const node of parents) {
		yield* match<
			[TreeNode, TypeContext],
			AsyncGenerator<Record<string, GraphQLFieldConfig<S, Context, any>>>
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

@injectable()
export class SchemaService {
	@inject(TypeContext)
	context: TypeContext

	async getSchema(
		projectId: ProjectId
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
		this.context.projectId = projectId
		const nodes = await this.context.getNestingNodes()
		const types = await toArray(typesFromNodes(nodes, this.context))
		const fields = await toArray(
			queriesFromNodes(nodes.filter(propEq(1, 'depth')), this.context)
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
