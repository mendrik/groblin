import { assertExists } from '@shared/asserts.ts'
import { throwError } from '@shared/errors.ts'
import { failOn } from '@shared/utils/guards.ts'
import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { capitalize } from '@shared/utils/ramda.ts'
import { type InsertObject, type Transaction, sql } from 'kysely'
import { path, T as _, isNil } from 'ramda'
import {
	isArray,
	isBoolean,
	isNumber,
	isPlainObj,
	isString
} from 'ramda-adjunct'
import type { DB, JsonArray, JsonObject } from 'src/database/schema.ts'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'
import type { JsonArrayImportInput } from 'src/resolvers/io-resolver.ts'
import type { Node } from 'src/resolvers/node-resolver.ts'
import { NodeType } from 'src/types.ts'
import { color } from 'src/utils/color-codec.ts'
import { date } from 'src/utils/date-codec.ts'

type DbValue = InsertObject<DB, 'values'>
type DbNode = InsertObject<DB, 'node'>

type Inserts = DbValue | DbNode

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
	caseOf([isString, NodeType.color], v => ({ color: color.parse(v) })),
	caseOf([isString, NodeType.date], v => ({ date: date.parse(v) })),
	caseOf([isString, _], v => ({ content: v })),
	caseOf([isNumber], v => ({ figure: v })),
	caseOf([isBoolean], v => ({ state: v })),
	caseOf([_], () => throwError('Unknown type'))
)

const nodeForName = async (
	name: string,
	value: any,
	parent: TreeNode,
	nodeId: AsyncGenerator<number>
): Promise<TreeNode> => {
	const node = parent.nodes.find(byNormalizedName(name))
	if (node) return node
	const { value: id } = await nodeId.next()
	return {
		id,
		name: capitalize(name),
		order: 0,
		parent_id: parent.id,
		type: typeForValue(value),
		nodes: []
	}
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
		console.log('processNode', json[0], json[1], node, list_path)
		const baseValue = {
			node_id: node.id,
			project_id,
			list_path,
			order: 0
		}
		yield* match<[JsonNode, TreeNode], AsyncGenerator<Inserts>>(
			/* - - - - Arrays - - - - */
			caseOf(
				[[_, isArray], { type: NodeType.list }],
				async function* ([k, v], n): AsyncGenerator<Inserts> {
					console.log(`array value ${k}`, v)

					// create list items
					for (const item of v) {
						const external_id = options.external_id
							? item[options.external_id]
							: null
						const { value: value_id } = await valueId.next()
						yield {
							id: value_id,
							value: { name: 'Item' },
							external_id,
							...baseValue
						} satisfies DbValue
						yield* processNode([k, item], n, [...list_path, value_id])
					}
				}
			),
			/* - - - - Objects items - - - - */
			caseOf(
				[[_, isPlainObj], { type: NodeType.object }],
				async function* ([k, v], n): AsyncGenerator<Inserts> {
					console.log('object value', k, v)
					for await (const [key, value] of Object.entries(v)) {
						const node = await nodeForName(key, value, n, nodeId)
						yield { ...node, project_id: project_id }
						yield* processNode([key, value], node, list_path)
					}
				}
			),
			/* - - - - Object properties - - - - */
			caseOf([_, _], async function* ([key, value]): AsyncGenerator<Inserts> {
				console.log('new value', key, value)
				const value_id = await valueId.next().then<number>(r => r.value)
				yield {
					id: value_id,
					value: valueForType(value, node.type),
					...baseValue
				} satisfies DbValue
			})
		)(json, node)
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

export const importJson =
	(
		{ lastProjectId }: LoggedInUser,
		json: JsonStart,
		node: TreeNode,
		options: Options
	) =>
	async (trx: Transaction<DB>): Promise<void> => {
		assertExists(lastProjectId, 'lastProjectId missing')
		const generator = processJson(
			lastProjectId,
			options,
			nodeId(trx),
			valueId(trx)
		)(['root', json], node, options.list_path ?? [])
		for await (const value of generator) {
			console.log(value)
		}
	}
