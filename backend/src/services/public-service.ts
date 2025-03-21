import { caseOf, match } from '@shared/utils/match.ts'
import {
	GraphQLEnumType,
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
import { inject, injectable } from 'inversify'
import { Maybe } from 'purify-ts'
import { T as _, assoc, isNotNil, objOf } from 'ramda'
import {
	type ListPath,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import {
	inputScalarForNode,
	jsonField,
	jsonForNode,
	operators,
	outputScalarForNode
} from 'src/utils/mappings.ts'
import { allNodes, isValueNode } from 'src/utils/nodes.ts'
import type { MediaValue } from './image-service.ts'
import { SchemaContext } from './schema-context.ts'

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
	type: outputScalarForNode(node, context),
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

const filterType = (
	node: TreeNode,
	ctx: SchemaContext
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
	ctx: SchemaContext
): GraphQLFieldConfigArgumentMap => {
	const filter = filterType(node, ctx)
	return {
		offset: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		name: { type: GraphQLString },
		direction: { type: directionType },
		order: { type: orderType(node) },
		allMatch: { type: new GraphQLList(filter) },
		anyMatch: { type: new GraphQLList(filter) }
	}
}

const resolveList = (
	node: TreeNode,
	context: SchemaContext
): GraphQLFieldConfig<any, any> => {
	const conf = resolveObj(node, context)

	return {
		type: new GraphQLList(conf.type),
		args: listArgs(node, context),
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
