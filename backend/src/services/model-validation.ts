import { parseContentValue } from '@shared/content.ts'
import type { ContentSnapshot } from '@shared/content-snapshot.ts'
import { parseNodeSettings } from '@shared/node-settings.ts'
import { GraphQLError } from 'graphql'
import type { Kysely } from 'kysely'
import { z } from 'zod'
import type { DB } from '../database/schema.ts'
import type { Node } from '../gql/schema.ts'
import { NodeType, type TreeNode } from '../types.ts'
import { parseNode } from '../utils/parse-node.ts'
import { buildPublicSchema } from './public-schema.ts'
import { SchemaTypes } from './schema-types.ts'

const invalid = (message: string): never => {
	throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}

export const lockProject = (db: Kysely<DB>, projectId: number) =>
	db
		.selectFrom('project')
		.select('id')
		.where('id', '=', projectId)
		.forUpdate()
		.executeTakeFirstOrThrow()

/** Validate the candidate transaction before exposing its schema or committing any data. */
export async function validateProjectModel(db: Kysely<DB>, projectId: number) {
	const rows = await db
		.selectFrom('node')
		.selectAll()
		.where('project_id', '=', projectId)
		.orderBy('order')
		.orderBy('id')
		.execute()
	if (rows.length > Number(process.env.MAX_PROJECT_FIELDS ?? 2000))
		invalid('Project field limit exceeded')
	const nodes = rows.map(parseNode)
	const settings = await db
		.selectFrom('node_settings')
		.selectAll()
		.where('project_id', '=', projectId)
		.execute()
	const values = await db
		.selectFrom('values')
		.selectAll()
		.where('project_id', '=', projectId)
		.execute()
	const model = validateModelRows(nodes, settings, values)
	const byId = new Map(nodes.map(node => [node.id, node]))
	const applyDepths = async (node: TreeNode): Promise<void> => {
		if (byId.get(node.id)?.depth !== node.depth)
			await db
				.updateTable('node')
				.set({ depth: node.depth })
				.where('id', '=', node.id)
				.where('project_id', '=', projectId)
				.execute()
		for (const child of node.nodes) await applyDepths(child)
	}
	await applyDepths(model)
}

export function validateModelRows(
	nodes: Node[],
	settings: { node_id: number; settings: unknown }[],
	values: Array<
		Pick<ContentSnapshot['values'][number], 'id' | 'node_id' | 'list_path'> & {
			value: unknown
		}
	>
): TreeNode {
	const roots = nodes.filter(node => node.parent_id == null)
	const root = roots[0]
	if (roots.length !== 1 || !root || root.type !== NodeType.root)
		invalid('A project must have exactly one root')
	const byId = new Map(nodes.map(node => [node.id, node]))
	const children = new Map<number, Node[]>()
	for (const node of nodes) {
		if (
			!/^(?!__)[_A-Za-z][_0-9A-Za-z]{0,127}$/.test(node.name) ||
			node.name === '_empty'
		)
			invalid(`Invalid API field name: ${node.name}`)
		if (node.parent_id == null) continue
		const parent = byId.get(node.parent_id)
		if (
			!parent ||
			![NodeType.root, NodeType.object, NodeType.list].includes(parent.type)
		)
			invalid('Only objects and lists can contain fields')
		if (node.type === NodeType.root)
			invalid('A project must have exactly one root')
		const siblings = children.get(node.parent_id) ?? []
		if (siblings.some(sibling => sibling.name === node.name))
			invalid(`Duplicate field: ${node.name}`)
		children.set(node.parent_id, [...siblings, node])
	}
	const ancestors = new Map<number, number[]>()
	const visited = new Set<number>()
	const tree = (node: Node, lists: number[], depth: number): TreeNode => {
		if (visited.has(node.id) || depth > 64)
			return invalid('Invalid parent or model deeper than 64 levels')
		visited.add(node.id)
		ancestors.set(node.id, lists)
		return {
			...node,
			depth,
			nodes: (children.get(node.id) ?? []).map(child =>
				tree(
					child,
					node.type === NodeType.list ? [...lists, node.id] : lists,
					depth + 1
				)
			)
		}
	}
	const model = tree(root, [], 1)
	if (visited.size !== nodes.length)
		invalid('Invalid parent: every field must belong to the root')
	const settingsByNode = new Map(
		settings.map(row => [row.node_id, row.settings])
	)
	for (const node of nodes)
		parseNodeSettings(node.type, settingsByNode.get(node.id))
	try {
		buildPublicSchema(
			model,
			new SchemaTypes(
				nodes,
				settings.map((row, index) => ({
					...row,
					id: index + 1,
					revision: 1,
					settings: z.json().parse(row.settings ?? {})
				}))
			)
		)
	} catch (error) {
		if (error instanceof Error) invalid(`Invalid API model: ${error.message}`)
		throw error
	}
	const valueById = new Map(values.map(value => [value.id, value]))
	for (const value of values) {
		const node = byId.get(value.node_id)
		if (!node) return invalid(`Value ${value.id} has no field`)
		try {
			parseContentValue(node.type, value.value, settingsByNode.get(node.id))
		} catch {
			invalid(
				`This model change would invalidate value ${value.id}; update the content first`
			)
		}
		const path = value.list_path ?? []
		const expected = ancestors.get(value.node_id) ?? []
		if (path.length !== expected.length)
			invalid(`This model change would move value ${value.id} outside its list`)
		for (const [index, id] of path.entries()) {
			const item = valueById.get(id)
			const parentPath = item?.list_path ?? []
			if (
				!item ||
				item.node_id !== expected[index] ||
				parentPath.length !== index ||
				!parentPath.every((parentId, position) => parentId === path[position])
			)
				invalid(`Invalid list ancestry for value ${value.id}`)
		}
	}
	return model
}
