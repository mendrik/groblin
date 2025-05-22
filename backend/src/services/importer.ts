import { throwError } from '@shared/errors.ts'
import { toArray } from '@shared/utils/async-generator.ts'
import { capitalize, entriesWithIndex, fork } from '@shared/utils/ramda.ts'
import { type InsertObject, type Transaction, sql } from 'kysely'
import { type TreeOf, caseOf, failOn, match } from 'matchblade'
import { path, T as _, eqBy, isNil, isNotEmpty, prop, uniqBy } from 'ramda'
import {
	isArray,
	isBoolean,
	isNumber,
	isPlainObj,
	isString
} from 'ramda-adjunct'
import type { DB, JsonArray, JsonObject } from 'src/database/schema.ts'
import type { JsonArrayImportInput } from 'src/resolvers/io-resolver.ts'
import type { Node } from 'src/resolvers/node-resolver.ts'
import { NodeType } from 'src/types.ts'
import { color } from 'src/utils/color-codec.ts'
import { date } from 'src/utils/date-codec.ts'

type DbValue = InsertObject<DB, 'values'>
type DbNode = InsertObject<DB, 'node'>
type DbNodeSetting = InsertObject<DB, 'node_settings'>

type Inserts = DbValue | DbNode | DbNodeSetting

type TreeNode = TreeOf<Node, 'nodes'>
type JsonStart = JsonArray | JsonObject
type JsonNode = [string, any]
type Options = JsonArrayImportInput
type PathToRoot = number[]

const normalize = (key: string) =>
	key
		.normalize('NFKD')
		// biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
		.replace(/[\u0300-\u036F]/g, '')
		.toLowerCase()

const byNormalizedName =
	(key: string) =>
	(node: TreeNode): boolean =>
		normalize(node.name) === normalize(key)

const isColorString = (json: unknown): json is string =>
	color.safeParse(json).success

const isDate = (json: unknown): json is string => date.safeParse(json).success

const typeForValue = match<[any], NodeType>(
	caseOf([isPlainObj], NodeType.object),
	caseOf([isArray], NodeType.list),
	caseOf([isNumber], NodeType.number),
	caseOf([isBoolean], NodeType.boolean),
	caseOf([isDate], NodeType.date),
	caseOf([isColorString], NodeType.color),
	caseOf([isString], NodeType.string),
	caseOf([_], () => throwError('Unknown type'))
)

const valueForType = match<[any, NodeType], JsonObject>(
	caseOf([isString, NodeType.color], v => ({ rgba: color.parse(v) })),
	caseOf([isString, NodeType.date], v => ({ date: date.parse(v) })),
	caseOf([isString, _], v => ({ content: v })),
	caseOf([isNumber], v => ({ figure: v })),
	caseOf([isBoolean], v => ({ state: v })),
	caseOf([_], () => throwError('Unknown type'))
)

type Created = boolean

const nodeForName = async (
	name: string,
	value: any,
	parent: TreeNode,
	nodeId: AsyncGenerator<number>
): Promise<[TreeNode, Created]> => {
	const node = parent.nodes.find(byNormalizedName(name))
	if (node) return [node, false]
	const { value: id } = await nodeId.next()
	const res: TreeNode = {
		id,
		name: capitalize(name),
		order: 0,
		depth: 0,
		parent_id: parent.id,
		type: typeForValue(value),
		nodes: []
	}
	parent.nodes.push(res)
	return [res, true]
}

const processJson = (
	project_id: number,
	options: Options,
	nodeId: AsyncGenerator<number>,
	valueId: AsyncGenerator<number>
) => {
	return async function* processNode(
		json: JsonNode,
		node: TreeNode,
		list_path: PathToRoot
	): AsyncGenerator<Inserts> {
		const baseValue = {
			node_id: node.id,
			project_id,
			order: 0
		}
		const matchCase = match<[JsonNode, TreeNode], AsyncGenerator<Inserts>>(
			/* - - - - Arrays - - - - */
			caseOf(
				[[_, isArray], { type: NodeType.list }],
				async function* ([k, v], n): AsyncGenerator<Inserts> {
					yield {
						node_id: n.id,
						project_id,
						settings: {
							scoped: true
						}
					}
					for (const item of v) {
						// create list items
						const external_id = options.external_id
							? item[options.external_id]
							: null
						const { value: value_id } = await valueId.next()
						const listItem = {
							...baseValue,
							id: value_id,
							value: { name: null },
							list_path,
							external_id
						}
						yield listItem
						yield* processNode([k, item], n, [...list_path, value_id])
					}
				}
			),
			/* - - - - Objects items - - - - */
			caseOf(
				[[_, isPlainObj], _],
				async function* ([_, v], n): AsyncGenerator<Inserts> {
					for await (const [key, value, index] of entriesWithIndex(v)) {
						if (eqBy(normalize, key, options.external_id ?? '')) continue
						const [subNode, created] = await nodeForName(key, value, n, nodeId)
						if (created) {
							yield {
								id: subNode.id,
								project_id: project_id,
								type: subNode.type,
								name: subNode.name,
								order: created ? index : subNode.order,
								parent_id: subNode.parent_id
							}
						}
						yield* processNode([key, value], subNode, list_path)
					}
				}
			),
			/* - - - - Object properties - - - - */
			caseOf(
				[[_, _], _],
				async function* ([_, value]): AsyncGenerator<Inserts> {
					const { value: value_id } = await valueId.next()
					yield {
						...baseValue,
						id: value_id,
						list_path,
						value: valueForType(value, node.type)
					}
				}
			)
		)
		yield* matchCase(json, node)
	}
}

async function* nodeId(trx: Transaction<DB>): AsyncGenerator<number> {
	while (true) {
		yield await sql`SELECT nextval('node_id_seq')`
			.execute(trx)
			.then<number | undefined>(path(['rows', 0, 'nextval']))
			.then(failOn(isNil, 'node_id_seq failed'))
	}
}

async function* valueId(trx: Transaction<DB>): AsyncGenerator<number> {
	while (true) {
		yield await sql`SELECT nextval('values_id_seq')`
			.execute(trx)
			.then<number | undefined>(path(['rows', 0, 'nextval']))
			.then(failOn(isNil, 'node_id_seq failed'))
	}
}

const isNode = (value: any): value is DbNode => 'type' in value
const isValue = (value: any): value is DbValue => 'list_path' in value
const isSetting = (value: any): value is DbNodeSetting => 'settings' in value

export const importJson =
	(project_id: number, json: JsonStart, node: TreeNode, options: Options) =>
	async (trx: Transaction<DB>): Promise<void> => {
		/**
		 * The generator climbs down a json structure and generates
		 * either values, nodes or node settings that need to be inserted
		 * into the database. if a node already exists it is used instead.
		 * The whole process runs inside a locking transaction, because we
		 * need to fetch referencing ids ahead of the execution.
		 */
		const generator = processJson(
			project_id,
			options,
			nodeId(trx),
			valueId(trx)
		)(['root', json], node, options.list_path ?? [])

		const [nodes, values, settings] = await toArray(generator).then(
			fork(isNode, isValue, isSetting)
		)
		if (isNotEmpty(nodes)) {
			await trx.insertInto('node').values(nodes).execute()
		}
		if (isNotEmpty(settings)) {
			await trx
				.insertInto('node_settings')
				.values(uniqBy(prop('node_id'), settings))
				.onConflict(c =>
					c.columns(['node_id']).doUpdateSet(e => ({
						settings: e.ref('excluded.settings')
					}))
				)
				.execute()
		}
		if (isNotEmpty(values)) {
			await trx
				.insertInto('values')
				.values(values)
				.onConflict(c =>
					c
						.columns(['external_id', 'node_id'])
						.where('external_id', 'is not', null)
						.doUpdateSet(e => ({
							value: e.ref('excluded.value')
						}))
				)
				.execute()
		}
	}
