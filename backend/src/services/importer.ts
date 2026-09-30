import { parseContentValue } from '@shared/content.ts'
import { GraphQLError } from 'graphql'
import { sql, type Transaction } from 'kysely'
import { listToTree } from 'matchblade'
import { z } from 'zod'
import type { DB, JsonValue } from '../database/schema.ts'
import type { JsonArrayImportInput } from '../gql/schema.ts'
import { NodeType, type TreeNode } from '../types.ts'
import { color } from '../utils/color-codec.ts'
import { isJsonObject } from '../utils/json.ts'
import { parseNode } from '../utils/parse-node.ts'
import { validateProjectModel } from './model-validation.ts'

const invalid = (message: string): never => {
	throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}
const normalize = (name: string) =>
	name
		.normalize('NFKD')
		.replace(/[\u0300-\u036F]/g, '')
		.toLowerCase()
const typeFor = (value: JsonValue): NodeType => {
	if (Array.isArray(value)) return NodeType.list
	if (isJsonObject(value)) return NodeType.object
	if (typeof value === 'number') return NodeType.number
	if (typeof value === 'boolean') return NodeType.boolean
	if (typeof value === 'string') {
		if (
			z.union([z.iso.date(), z.iso.datetime({ offset: true })]).safeParse(value)
				.success
		)
			return NodeType.date
		if (color.safeParse(value).success) return NodeType.color
		return NodeType.string
	}
	return invalid('Null values cannot define a new field')
}
const scalarValue = (value: JsonValue, type: NodeType) => {
	if (type === NodeType.color && typeof value === 'string')
		return { rgba: color.parse(value) }
	if (type === NodeType.date && typeof value === 'string')
		return { date: value }
	if (type === NodeType.choice && typeof value === 'string')
		return { selected: value }
	if (type === NodeType.number && typeof value === 'number')
		return { figure: value }
	if (type === NodeType.boolean && typeof value === 'boolean')
		return { state: value }
	if (
		[NodeType.string, NodeType.article].includes(type) &&
		typeof value === 'string'
	)
		return { content: value }
	return invalid('Imported value does not match the field type')
}

/** Execute under the caller's project lock and transaction, using the current model. */
export async function importJson(
	trx: Transaction<DB>,
	projectId: number,
	json: JsonValue,
	options: JsonArrayImportInput
) {
	const rows = await trx
		.selectFrom('node')
		.selectAll()
		.where('project_id', '=', projectId)
		.orderBy('order')
		.orderBy('id')
		.execute()
	const root = listToTree('id', 'parent_id', 'nodes')(rows.map(parseNode))
	const byId = new Map<number, TreeNode>()
	const index = (node: TreeNode) => {
		byId.set(node.id, node)
		node.nodes.forEach(index)
	}
	index(root)
	const target = byId.get(options.node_id)
	if (!target) return invalid('Import target not found')
	const settings = await trx
		.selectFrom('node_settings')
		.selectAll()
		.where('project_id', '=', projectId)
		.execute()
	const bySettings = new Map(settings.map(row => [row.node_id, row.settings]))
	let visited = 0
	const existing = (nodeId: number, path: number[]) =>
		trx
			.selectFrom('values')
			.selectAll()
			.where('project_id', '=', projectId)
			.where('node_id', '=', nodeId)
			.where(
				sql<boolean>`coalesce(list_path, '{}'::integer[]) = ${path}::integer[]`
			)
	const findField = async (
		parent: TreeNode,
		name: string,
		value: JsonValue
	) => {
		const found = parent.nodes.find(
			node => normalize(node.name) === normalize(name)
		)
		if (found) return found
		if (!options.structure)
			return invalid(
				`Unknown field ${name}. Enable structure creation or model it first.`
			)
		const created = await trx
			.insertInto('node')
			.values({
				project_id: projectId,
				parent_id: parent.id,
				name: name.charAt(0).toUpperCase() + name.slice(1),
				type: typeFor(value),
				order: parent.nodes.length
			})
			.returningAll()
			.executeTakeFirstOrThrow()
		const node = { ...parseNode(created), nodes: [] }
		parent.nodes.push(node)
		byId.set(node.id, node)
		if (node.type === NodeType.list) {
			const setting = { scoped: true }
			await trx
				.insertInto('node_settings')
				.values({ project_id: projectId, node_id: node.id, settings: setting })
				.execute()
			bySettings.set(node.id, setting)
		}
		return node
	}
	const visit = async (
		value: JsonValue,
		node: TreeNode,
		path: number[],
		depth: number,
		replaceNested: boolean
	): Promise<void> => {
		if (++visited > 100000 || depth > 64)
			return invalid('Import is too large or deeper than 64 levels')
		if (node.type === NodeType.list) {
			if (!Array.isArray(value))
				return invalid(`Field ${node.name} expects an array`)
			if (value.length > 10000)
				return invalid('Import must contain at most 10000 rows per list')
			if (replaceNested && node.id !== target.id)
				await existing(node.id, path)
					.clearSelect()
					.select('id')
					.execute()
					.then(async rows => {
						if (rows.length)
							await trx
								.deleteFrom('values')
								.where('project_id', '=', projectId)
								.where(
									'id',
									'in',
									rows.map(row => row.id)
								)
								.execute()
					})
			const identities = new Set<string>()
			const highest = await existing(node.id, path)
				.clearSelect()
				.select(({ fn }) => fn.max<number>('order').as('highest'))
				.executeTakeFirst()
			let order = (highest?.highest ?? -1) + 1
			for (const item of value) {
				if (!isJsonObject(item))
					return invalid('List imports require objects as items')
				const externalKey =
					options.external_id &&
					Object.keys(item).find(
						key => normalize(key) === normalize(options.external_id ?? '')
					)
				const identity = externalKey ? item[externalKey] : undefined
				if (
					identity !== undefined &&
					typeof identity !== 'string' &&
					typeof identity !== 'number'
				)
					return invalid('External IDs must be strings or numbers')
				const externalId = identity == null ? null : String(identity)
				if (node.id === target.id && options.external_id && !externalId)
					return invalid('Every item must have a non-empty external ID')
				if (externalId && identities.has(externalId))
					return invalid('Duplicate external ID in import')
				if (externalId) identities.add(externalId)
				const saved = externalId
					? await existing(node.id, path)
							.where('external_id', '=', externalId)
							.executeTakeFirst()
					: undefined
				const row =
					saved ??
					(await trx
						.insertInto('values')
						.values({
							node_id: node.id,
							project_id: projectId,
							value: { name: '' },
							list_path: path,
							external_id: externalId,
							order: order++
						})
						.returningAll()
						.executeTakeFirstOrThrow())
				await object(
					item,
					node,
					[...path, row.id],
					depth + 1,
					!!saved || replaceNested
				)
			}
			return
		}
		if (node.type === NodeType.object || node.type === NodeType.root) {
			if (!isJsonObject(value))
				return invalid(`Field ${node.name} expects an object`)
			return object(value, node, path, depth + 1, replaceNested)
		}
		const content = parseContentValue(
			node.type,
			scalarValue(value, node.type),
			bySettings.get(node.id)
		)
		const previous = await existing(node.id, path).executeTakeFirst()
		if (previous) {
			if (JSON.stringify(previous.value) !== JSON.stringify(content))
				await trx
					.updateTable('values')
					.set({ value: content })
					.where('id', '=', previous.id)
					.where('project_id', '=', projectId)
					.execute()
		} else
			await trx
				.insertInto('values')
				.values({
					node_id: node.id,
					project_id: projectId,
					value: content,
					list_path: path,
					order: 0
				})
				.execute()
	}
	const object = async (
		value: DB['values']['value'],
		node: TreeNode,
		path: number[],
		depth: number,
		replaceNested: boolean
	): Promise<void> => {
		if (!isJsonObject(value)) return invalid('Expected an object')
		for (const [name, item] of Object.entries(value)) {
			if (
				options.external_id &&
				normalize(name) === normalize(options.external_id)
			)
				continue
			if (item === undefined) return invalid('Invalid imported value')
			await visit(
				item,
				await findField(node, name, item),
				path,
				depth,
				replaceNested
			)
		}
	}
	await visit(json, target, options.list_path ?? [], 1, false)
	await validateProjectModel(trx, projectId)
}
