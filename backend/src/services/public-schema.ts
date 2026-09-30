import {
	assertValidSchema,
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLError,
	type GraphQLFieldConfig,
	type GraphQLFieldConfigArgumentMap,
	type GraphQLInputFieldConfig,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString
} from 'graphql'
import { caseOf, match } from 'matchblade'
import { Maybe } from 'purify-ts'
import { T as _, assoc, isNotNil, objOf } from 'ramda'
import { type ListPath, NodeType, type TreeNode } from 'src/types.ts'
import {
	inputScalarForNode,
	jsonField,
	jsonForNode,
	operators,
	outputScalarForNode
} from 'src/utils/mappings.ts'
import { allNodes, isValueNode } from 'src/utils/nodes.ts'
import { isJsonObject } from '../utils/json.ts'
import type { MediaValue } from './image-service.ts'
import type { SchemaContext } from './schema-context.ts'
import type { SchemaTypes } from './schema-types.ts'

type Runtime = Pick<
	SchemaContext,
	'getValue' | 'getMedia' | 'listItems' | 'articleHtml'
>
type SchemaDefinition = SchemaTypes & { runtime?: Runtime }

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
	context: SchemaDefinition
): GraphQLFieldConfig<any, any> => ({
	type: outputScalarForNode(node, context),
	resolve: context.runtime
		? async parent => {
				const path = pathFor(parent)
				const maybeValue = await context.runtime
					?.getValue(node, path)
					?.then(Maybe.fromNullable)
				const value = maybeValue?.extractNullable()
				if (node.type === NodeType.media && value) {
					return context.runtime?.getMedia(value as MediaValue)
				}
				if (
					node.type === NodeType.article &&
					value &&
					isJsonObject(value.value) &&
					typeof value.value.content === 'string'
				)
					return context.runtime?.articleHtml(value.value.content)
				return jsonForNode(node, value?.value)
			}
		: undefined
})

const filterType = (
	node: TreeNode,
	ctx: SchemaDefinition
): GraphQLInputObjectType => {
	const allChildNodes = [...allNodes(node)].filter(isValueNode)
	return new GraphQLInputObjectType({
		name: `${node.name}Filter`,
		fields: allChildNodes.reduce(
			(acc, node) => {
				const ops = operators(node)
				if (ops.length === 0) return acc
				for (const op of ops) {
					const key = op === 'eq' ? node.name : `${node.name}_${op}`
					if (Object.hasOwn(acc, key))
						throw new GraphQLError(`Ambiguous filter ${node.name}: ${key}`, {
							extensions: { code: 'BAD_USER_INPUT' }
						})
					acc[key] = {
						type: inputScalarForNode(node, op, ctx)
					}
				}
				return acc
			},
			{} as Record<string, GraphQLInputFieldConfig>
		)
	})
}
const orderType = (node: TreeNode): GraphQLEnumType => {
	const allChildNodes = [...allNodes(node)].filter(isValueNode)
	return new GraphQLEnumType({
		name: `${node.name}Order`,
		values: allChildNodes.reduce(
			(acc, node) =>
				assoc(
					node.name,
					{
						value: {
							json_field: jsonField(node),
							node_id: node.id
						}
					},
					acc
				),
			{}
		)
	})
}

const directionType = new GraphQLEnumType({
	name: `Direction`,
	values: {
		asc: { value: 'asc' },
		desc: { value: 'desc' }
	}
})

const listArgs = (
	node: TreeNode,
	ctx: SchemaDefinition
): GraphQLFieldConfigArgumentMap => {
	const hasFields = [...allNodes(node)].some(isValueNode)
	const names = [...allNodes(node)].filter(isValueNode).map(n => n.name)
	if (new Set(names).size !== names.length)
		throw new GraphQLError(`List ${node.name} has ambiguous field names`, {
			extensions: { code: 'BAD_USER_INPUT' }
		})
	return {
		offset: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		name: { type: GraphQLString },
		direction: { type: directionType },
		...(hasFields
			? {
					order: { type: orderType(node) },
					filter: { type: new GraphQLList(filterType(node, ctx)) }
				}
			: {})
	}
}

const resolveList = (
	node: TreeNode,
	context: SchemaDefinition
): GraphQLFieldConfig<any, any> => {
	const conf = resolveObj(node, context)

	return {
		type: new GraphQLList(conf.type),
		args: listArgs(node, context),
		resolve: async (parent, args) => {
			const items =
				(await context.runtime?.listItems(node.id, pathFor(parent), args)) ?? []
			return items.map(item => ({ id: item.id, parent }))
		}
	}
}

const resolveObj = (
	node: TreeNode,
	context: SchemaDefinition
): GraphQLFieldConfig<any, any> => {
	const fields = node.nodes.map(
		n => [n.name, fieldForNode(n, context)] as const
	)
	return {
		type: new GraphQLObjectType({
			name: node.name,
			fields: fields.length
				? Object.fromEntries(fields)
				: { _empty: { type: GraphQLBoolean, resolve: () => true } }
		}),
		resolve: objOf('parent')
	}
}

const fieldForNode = match<
	[TreeNode, SchemaDefinition],
	GraphQLFieldConfig<any, any>
>(
	caseOf([{ type: NodeType.list }, _], resolveList),
	caseOf([{ type: NodeType.object }, _], resolveObj),
	caseOf([_, _], resolveValue)
)

export function buildPublicSchema(
	root: TreeNode,
	types: SchemaTypes,
	runtime?: Runtime
): GraphQLSchema {
	const context = Object.assign(types, { runtime })
	const query = resolveObj(root, context)
	const schema = new GraphQLSchema({
		types: types.getEnums(),
		query: query.type as GraphQLObjectType
	})
	assertValidSchema(schema)
	return schema
}
