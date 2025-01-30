import type {
	BooleanType,
	ChoiceType,
	ColorType,
	DateType,
	MediaType,
	NumberType,
	StringType
} from '@shared/json-value-types.ts'
import { awaitObj } from '@shared/utils/await-obj.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import {
	GraphQLBoolean,
	type GraphQLFieldConfig,
	GraphQLFloat,
	GraphQLList,
	GraphQLObjectType,
	type GraphQLOutputType,
	GraphQLSchema,
	GraphQLString,
	printSchema
} from 'graphql'
import { GraphQLDate } from 'graphql-scalars'
import type { GraphQLSchemaWithContext, YogaInitialContext } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { T as _, assoc, map } from 'ramda'
import type { JsonValue } from 'src/database/schema.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { NodeType, type ProjectId, type TreeNode } from 'src/types.ts'
import { TypeContext } from './type-context.ts'

const hasValue = <T>(value: T | null): value is T => value != null

const isStringType = hasValue<StringType>
const isNumberType = hasValue<NumberType>
const isColorType = hasValue<ColorType>
const isDateType = hasValue<DateType>
const isMediaype = hasValue<MediaType>
const isChoiceType = hasValue<ChoiceType>
const isBooleanType = hasValue<BooleanType>

const scalarForNode = match<[TreeNode], GraphQLOutputType>(
	caseOf([{ type: NodeType.boolean }], GraphQLBoolean),
	caseOf([{ type: NodeType.number }], GraphQLFloat),
	caseOf([{ type: NodeType.date }], GraphQLDate),
	caseOf([_], GraphQLString)
)

const jsonForNode = match<[TreeNode, any], JsonValue>(
	caseOf([{ type: NodeType.string }, isStringType], (_, v) => v.content),
	caseOf([{ type: NodeType.color }, isColorType], (_, v) => v.rgba as number[]),
	caseOf([{ type: NodeType.number }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.date }, isDateType], (_, v) => v.date.toString()),
	caseOf([{ type: NodeType.media }, isMediaype], (_, v) => v.name),
	caseOf([{ type: NodeType.choice }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.boolean }, isBooleanType], (_, v) => v.state),
	caseOf([_, _], () => null)
)

const resolveValue = (
	node: TreeNode,
	context: TypeContext
): GraphQLFieldConfig<any, any> => ({
	type: scalarForNode(node),
	resolve: path =>
		context.getValue(node, path).then(val => jsonForNode(node, val))
})

const resolveList = (
	node: TreeNode,
	context: TypeContext
): GraphQLFieldConfig<any, any> => {
	const conf = resolveObj(node, context)
	return {
		type: new GraphQLList(conf.type),
		resolve: (path, b, c, d) =>
			context
				.listItems(node.id, path)
				.then(
					map((item: Value) =>
						conf.resolve?.([...(path ?? []), item.id], b, c, d)
					)
				)
				.then(Promise.all.bind(Promise))
	}
}

const resolveObj = (
	node: TreeNode,
	context: TypeContext
): GraphQLFieldConfig<any, any> => {
	const fields = node.nodes.map(
		n => [n.name, fieldForNode(n, context)] as const
	)
	return {
		type: new GraphQLObjectType({
			name: node.name,
			fields: Object.fromEntries(fields)
		}),
		resolve: (path, b, c, d) =>
			awaitObj(
				fields.reduce(
					(acc, [name, field]) =>
						assoc(name, field.resolve?.(path, b, c, d), acc),
					{}
				)
			)
	}
}

const fieldForNode = match<
	[TreeNode, TypeContext],
	GraphQLFieldConfig<any, any>
>(
	caseOf([{ type: NodeType.list }, _], resolveList),
	caseOf([{ type: NodeType.object }, _], resolveObj),
	caseOf([_, _], resolveValue)
)

@injectable()
export class SchemaService {
	@inject(TypeContext)
	context: TypeContext

	async getSchema(
		projectId: ProjectId
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
		await this.context.init(projectId)
		const root = await this.context.getRoot()
		const query = resolveObj(root, this.context)

		const schema = new GraphQLSchema({
			query: query.type as any
		})

		console.log(printSchema(schema))

		return schema
	}
}
