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
	GraphQLEnumType,
	type GraphQLFieldConfig,
	type GraphQLFieldConfigArgumentMap,
	GraphQLFloat,
	GraphQLInt,
	GraphQLList,
	GraphQLObjectType,
	type GraphQLOutputType,
	GraphQLSchema,
	GraphQLString
} from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Maybe } from 'purify-ts'
import { T as _, assoc, isNil, isNotNil, objOf } from 'ramda'
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
const isValueNode = (node: TreeNode) =>
	![NodeType.object, NodeType.root, NodeType.list].includes(node.type)

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
	caseOf([{ type: NodeType.media }, _], (n, c) => c.getMediaType(n)),
	caseOf([_, _], GraphQLString)
)

const jsonForNode = match<[TreeNode, any], JsonValue>(
	caseOf([{ type: NodeType.string }, isStringType], (_, v) => v.content),
	caseOf([{ type: NodeType.color }, isColorType], (_, v) => v.rgba as number[]),
	caseOf([{ type: NodeType.number }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.date }, isDateType], (_, v) => v.date.toString()),
	caseOf([{ type: NodeType.choice }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.boolean }, isNil], (_, v) => false),
	caseOf([{ type: NodeType.boolean }, isBooleanType], (_, v) => v.state),
	caseOf([{ type: NodeType.article }, isArticleType], (_, v) => v.content),
	caseOf([{ type: NodeType.media }, isMediaype], () =>
		throwError('Unreachable code')
	),
	caseOf([_, _], () => null)
)

const dbType = match<[TreeNode], string>(
	caseOf([{ type: NodeType.string }], 'content'),
	caseOf([{ type: NodeType.color }], 'rgba'),
	caseOf([{ type: NodeType.number }], 'figure'),
	caseOf([{ type: NodeType.date }], 'date'),
	caseOf([{ type: NodeType.choice }], 'selected'),
	caseOf([{ type: NodeType.boolean }], 'state'),
	caseOf([{ type: NodeType.article }], 'content'),
	caseOf([{ type: NodeType.media }], 'file')
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
		const maybeValue = await context
			.getValue(node, path)
			.then(Maybe.fromNullable)
		const value = maybeValue.extractNullable()
		if (node.type === NodeType.media && value) {
			return context.getMedia(value as MediaValue)
		}
		return jsonForNode(node, value?.value)
	}
})

export function* iterateNodes(root: TreeNode): Generator<TreeNode> {
	yield root
	for (const child of root.nodes) {
		yield* iterateNodes(child)
	}
}

const resolveList = (
	node: TreeNode,
	context: SchemaContext
): GraphQLFieldConfig<any, any> => {
	const conf = resolveObj(node, context)
	const allChildNodes = [...iterateNodes(node)].filter(isValueNode)
	const ListArgs: GraphQLFieldConfigArgumentMap = {
		offset: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		direction: {
			type: new GraphQLEnumType({
				name: `${node.name}Direction`,
				values: {
					asc: { value: 'asc' },
					desc: { value: 'desc' }
				}
			})
		},
		order: {
			type: new GraphQLEnumType({
				name: `${node.name}Order`,
				values: allChildNodes.reduce(
					(acc, node) =>
						assoc(
							node.name,
							{
								value: {
									json_field: dbType(node),
									node_id: node.id
								}
							},
							acc
						),
					{}
				)
			})
		}
	}

	return {
		type: new GraphQLList(conf.type),
		args: ListArgs,
		resolve: async (parent, args) => {
			const items = await context.listItems(node.id, pathFor(parent), args)
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
		resolve: objOf('parent')
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
		return schema
	}
}
