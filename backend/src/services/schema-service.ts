import type {
	BooleanType,
	ChoiceType,
	ColorType,
	DateType,
	MediaType,
	NumberType,
	StringType
} from '@shared/json-value-types.ts'
import { toArray } from '@shared/utils/async-generator.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import type { GraphQLScalarType, GraphQLType } from 'graphql'
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
import { T as _, mergeAll, prop, propEq } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import type { JsonObject, JsonValue } from 'src/database/schema.ts'
import {
	type Context,
	type ListPath,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import { WhereObjectScalar } from 'src/utils/where-scalar.ts'
import { TypeContext } from './type-context.ts'

type Fields<S, C, A> = ThunkObjMap<GraphQLFieldConfig<S, C, A>>

const hasValue = <T>(value: T | undefined): value is T => value != null

const isStringType = hasValue<StringType>
const isNumberType = hasValue<NumberType>
const isColorType = hasValue<ColorType>
const isDateType = hasValue<DateType>
const isMediaype = hasValue<MediaType>
const isChoiceType = hasValue<ChoiceType>
const isBooleanType = hasValue<BooleanType>

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

const jsonForNode = match<[TreeNode, any], JsonValue>(
	caseOf([{ type: NodeType.string }, isStringType], (_, v) => v.content),
	caseOf([{ type: NodeType.color }, isColorType], (_, v) => v.rgba as number[]),
	caseOf([{ type: NodeType.color }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.color }, isDateType], (_, v) => v.date.toString()),
	caseOf([{ type: NodeType.color }, isMediaype], (_, v) => v.name),
	caseOf([{ type: NodeType.color }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.color }, isBooleanType], (_, v) => v.state),
	caseOf([_, _], null)
)

async function* fieldsFor<S, C, A>(
	parent: TreeNode,
	context: TypeContext,
	path: ListPath = []
): AsyncGenerator<Fields<S, C, A>> {
	for (const node of parent.nodes) {
		const type = scalarForNode(node, context)
		if (!type) continue
		const required = await context.isRequired(node.id)
		yield {
			[node.name]: {
				type: required ? new GraphQLNonNull(type) : type,
				resolve: async () => {
					const value = (await context
						.getValue(node, path)
						.map(prop('value'))
						.orDefault(undefined)) as JsonObject

					return jsonForNode(node, value)
				}
			}
		}
	}
}

const toFieldMap = <S, C, A>(gen: AsyncGenerator<Fields<S, C, A>>) =>
	toArray(gen).then(mergeAll)

type NamedType = Record<string, GraphQLFieldConfig<any, Context, any>>

async function* resolveList<S>(
	node: TreeNode,
	context: TypeContext,
	path: ListPath
): AsyncGenerator<NamedType> {
	const innerType = new GraphQLList(
		context.types.get(node.id)?.type as GraphQLObjectType
	)
	yield {
		[node.name]: {
			type: innerType,
			args: {
				whereEq: { type: WhereObjectScalar },
				whereNotEq: { type: WhereObjectScalar },
				limit: { type: GraphQLFloat }
			},
			resolve: async () => {
				const listItems = await context.listItems(node.id, path)
				return listItems.map(item =>
					resolveObject(node, context, [...path, item.id])
				)
			}
		}
	}
}

async function* resolveObject(
	node: TreeNode,
	context: TypeContext,
	path: ListPath
): AsyncGenerator<NamedType> {
	const type = context.types.get(node.id)?.type as GraphQLObjectType
	yield {
		[node.name]: {
			type,
			resolve: () => toFieldMap(queriesFromNodes(node.nodes, context, path))
		}
	}
}

async function* queriesFromNodes<S>(
	parents: TreeNode[],
	context: TypeContext,
	path: ListPath = []
): AsyncGenerator<NamedType> {
	for (const node of parents) {
		yield* match<[TreeNode, TypeContext, ListPath], AsyncGenerator<NamedType>>(
			caseOf([{ type: NodeType.list }, _, _], resolveList),
			caseOf([{ type: NodeType.object }, _, _], resolveObject)
		)(node, context, path)
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
