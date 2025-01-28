import type {
	BooleanType,
	ChoiceType,
	ColorType,
	DateType,
	MediaType,
	NumberType,
	StringType
} from '@shared/json-value-types.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import type { GraphQLOutputType, ThunkObjMap } from 'graphql'
import {
	GraphQLBoolean,
	type GraphQLFieldConfig,
	GraphQLFloat,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	printSchema
} from 'graphql'
import { GraphQLDate } from 'graphql-scalars'
import type { GraphQLSchemaWithContext, YogaInitialContext } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { T as _, isNotNil, map, pipe, propEq } from 'ramda'
import { compact } from 'ramda-adjunct'
import type { JsonValue } from 'src/database/schema.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import {
	type Context,
	type ListPath,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import { WhereObjectScalar } from 'src/utils/where-scalar.ts'
import { TypeContext } from './type-context.ts'

type Fields<S, C, A> = Record<string, GraphQLFieldConfig<S, C, A>>

const hasValue = <T>(value: T | null): value is T => value != null

const isStringType = hasValue<StringType>
const isNumberType = hasValue<NumberType>
const isColorType = hasValue<ColorType>
const isDateType = hasValue<DateType>
const isMediaype = hasValue<MediaType>
const isChoiceType = hasValue<ChoiceType>
const isBooleanType = hasValue<BooleanType>

const scalarForNode = match<[TreeNode, TypeContext], GraphQLOutputType | null>(
	caseOf([{ type: NodeType.string }], GraphQLString),
	caseOf([{ type: NodeType.boolean }], GraphQLBoolean),
	caseOf([{ type: NodeType.number }], GraphQLFloat),
	caseOf([{ type: NodeType.article }], GraphQLString),
	caseOf([{ type: NodeType.date }], GraphQLDate),
	caseOf([{ type: NodeType.media }], GraphQLString),
	caseOf([{ type: NodeType.choice }], GraphQLString),
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
	caseOf([{ type: NodeType.number }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.date }, isDateType], (_, v) => v.date.toString()),
	caseOf([{ type: NodeType.media }, isMediaype], (_, v) => v.name),
	caseOf([{ type: NodeType.choice }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.boolean }, isBooleanType], (_, v) => v.state),
	caseOf([_, _], null)
)

type Field<S = any, A = any> = GraphQLFieldConfig<S, Context, A> & {
	name: string
}

function fieldFor<S, A>(
	node: TreeNode,
	context: TypeContext,
	path: ListPath = []
): Field<S, A> | null {
	const type = scalarForNode(node, context) ?? context.types.get(node.id)?.type
	const required = context.isRequired(node.id)
	return type
		? {
				name: node.name,
				type: required ? new GraphQLNonNull(type) : type,
				resolve: async () => {
					const value = await context.getValue(node, path)
					return jsonForNode(node, value)
				}
			}
		: null
}

function typeFromNode<S, A>(
	node: TreeNode,
	context: TypeContext
): GraphQLObjectType | GraphQLList<GraphQLObjectType> {
	const fields: (
		n: TreeNode[]
	) => ThunkObjMap<GraphQLFieldConfig<S, Context, A>> = pipe(
		xs => xs.map(n => fieldFor(n, context)),
		compact,
		mapBy(({ name }: Field) => name),
		Object.fromEntries
	)

	const type = new GraphQLObjectType({
		name: node.name,
		fields: fields(node.nodes)
	})
	const objectType = node.type === NodeType.list ? new GraphQLList(type) : type
	context.types.set(node.id, {
		type: objectType,
		node
	})
	return objectType
}

function resolveList<S>(
	node: TreeNode,
	context: TypeContext,
	path: ListPath
): Field {
	const innerType = context.types.get(node.id)?.type as GraphQLObjectType
	return {
		name: node.name,
		type: new GraphQLList(innerType),
		args: {
			whereEq: { type: WhereObjectScalar },
			whereNotEq: { type: WhereObjectScalar },
			limit: { type: GraphQLFloat }
		},
		resolve: (...args) =>
			context.listItems(node.id, path).then(
				map((item: Value) => {
					const res = resolveObject(node, context, [...path, item.id])
					console.log(item.id, res)
					return res.resolve?.(...args)
				})
			)
	}
}

function resolveObject(
	node: TreeNode,
	context: TypeContext,
	path: ListPath
): Field {
	const type = context.types.get(node.id)?.type as GraphQLObjectType
	return {
		name: node.name,
		type,
		resolve: () => queryForNode(node, context, path)
	}
}

function queryForNode<S>(
	node: TreeNode,
	context: TypeContext,
	path: ListPath = []
): Field | null {
	return match<[TreeNode, TypeContext, ListPath], Field | null>(
		caseOf([{ type: NodeType.list }, _, _], resolveList),
		caseOf([{ type: NodeType.object }, _, _], resolveObject),
		caseOf([_, _, _], () => null)
	)(node, context, path)
}

@injectable()
export class SchemaService {
	@inject(TypeContext)
	context: TypeContext

	async getSchema(
		projectId: ProjectId
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
		await this.context.init(projectId)
		const nodes = await this.context.getNestingNodes()
		const types = nodes.map(node => typeFromNode(node, this.context))
		const fields = nodes
			.filter(propEq(1, 'depth'))
			.map(n => queryForNode(n, this.context))
			.filter(isNotNil)

		console.log(
			'fields',
			mapBy(({ name }: Field) => name, fields)
		)

		const schema = new GraphQLSchema({
			types: types as any,
			query: new GraphQLObjectType({
				name: 'Query',
				fields: mapBy(({ name }: Field) => name, fields) as any
			})
		})

		console.log(printSchema(schema))

		return schema
	}
}
