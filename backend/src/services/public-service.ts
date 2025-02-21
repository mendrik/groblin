import { throwError } from '@shared/errors.ts'
import type {
	ArticleType,
	BooleanType,
	ChoiceType,
	ColorType,
	DateType,
	MediaType,
	NumberType,
	StringType
} from '@shared/json-value-types.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import {
	GraphQLBoolean,
	type GraphQLFieldConfig,
	GraphQLFloat,
	GraphQLInt,
	GraphQLList,
	GraphQLObjectType,
	type GraphQLOutputType,
	GraphQLSchema,
	GraphQLString
} from 'graphql'
import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Maybe } from 'purify-ts'
import { T as _, isNotNil } from 'ramda'
import type { JsonValue } from 'src/database/schema.ts'
import {
	type ListPath,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import type { MediaValue } from './image-service.ts'
import { SchemaContext } from './schema-context.ts'

const hasValue = <T>(value: T | null): value is T => value != null

const isStringType = hasValue<StringType>
const isNumberType = hasValue<NumberType>
const isColorType = hasValue<ColorType>
const isDateType = hasValue<DateType>
const isMediaype = hasValue<MediaType>
const isChoiceType = hasValue<ChoiceType>
const isBooleanType = hasValue<BooleanType>
const isArticleType = hasValue<ArticleType>

const scalarForNode = match<[TreeNode, SchemaContext], GraphQLOutputType>(
	caseOf([{ type: NodeType.boolean }, _], GraphQLBoolean),
	caseOf([{ type: NodeType.number }, _], GraphQLFloat),
	caseOf([{ type: NodeType.color }, _], new GraphQLList(GraphQLInt)),
	caseOf([{ type: NodeType.date }, _], GraphQLDateTime),
	caseOf([{ type: NodeType.choice }, _], (n, c) => c.getEnumType(n.id)),
	caseOf([{ type: NodeType.media }, _], GraphQLJSONObject),
	caseOf([_, _], GraphQLString)
)

const jsonForNode = match<[TreeNode, any], JsonValue>(
	caseOf([{ type: NodeType.string }, isStringType], (_, v) => v.content),
	caseOf([{ type: NodeType.color }, isColorType], (_, v) => v.rgba as number[]),
	caseOf([{ type: NodeType.number }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.date }, isDateType], (_, v) => v.date.toString()),
	caseOf([{ type: NodeType.choice }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.boolean }, isBooleanType], (_, v) => v.state),
	caseOf([{ type: NodeType.article }, isArticleType], (_, v) => v.content),
	caseOf([{ type: NodeType.media }, isMediaype], () =>
		throwError('Unreachable code')
	),
	caseOf([_, _], () => null)
)

interface ResolvedNode {
	id?: number
	parent?: ResolvedNode // Parent reference
}

// Helper to compute path from parent chain
const pathFor = (obj?: ResolvedNode): ListPath => {
	if (!obj) return []
	return [...pathFor(obj.parent), obj.id].filter(isNotNil)
}

const resolveValue = (
	node: TreeNode,
	context: SchemaContext
): GraphQLFieldConfig<any, any> => ({
	type: scalarForNode(node, context),
	resolve: async parent => {
		const path = pathFor(parent)
		const val = await context.getValue(node, path).then(Maybe.fromNullable)
		return await val.mapOrDefault(value => {
			if (node.type === NodeType.media) {
				return context.getImageSet(value as MediaValue)
			}
			return jsonForNode(node, value.value)
		}, null)
	}
})

const resolveList = (
	node: TreeNode,
	context: SchemaContext
): GraphQLFieldConfig<any, any> => {
	const conf = resolveObj(node, context)
	return {
		type: new GraphQLList(conf.type),
		resolve: async parent => {
			const items = await context.listItems(node.id, pathFor(parent))
			return items.map(item => ({ id: item.id, parent }))
		}
	}
}

const resolveObj = (
	node: TreeNode,
	context: SchemaContext
): GraphQLFieldConfig<any, any> => {
	const fields = node.nodes.map(
		n => [n.name, fieldForNode(n, context)] as const
	)
	return {
		type: new GraphQLObjectType({
			name: node.name,
			fields: Object.fromEntries(fields)
		}),
		resolve: parent => ({ parent })
	}
}

const fieldForNode = match<
	[TreeNode, SchemaContext],
	GraphQLFieldConfig<any, any>
>(
	caseOf([{ type: NodeType.list }, _], resolveList),
	caseOf([{ type: NodeType.object }, _], resolveObj),
	caseOf([_, _], resolveValue)
)

@injectable()
export class PublicService {
	@inject(SchemaContext)
	context: SchemaContext

	async getSchema(projectId: ProjectId): Promise<GraphQLSchema> {
		await this.context.init(projectId)
		const root = await this.context.getRoot()
		const query = resolveObj(root, this.context)
		const schema = new GraphQLSchema({
			types: [...this.context.getEnums()],
			query: query.type as GraphQLObjectType
		})
		// console.log(printSchema(schema))
		return schema
	}
}
