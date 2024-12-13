import { assertExists } from '@shared/asserts.ts'
import { failOn } from '@shared/utils/guards.ts'
import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { capitalize } from '@shared/utils/ramda.ts'
import { type InsertObject, type Transaction, sql } from 'kysely'
import { path, T as _, isNil } from 'ramda'
import { isArray, isPlainObj } from 'ramda-adjunct'
import type { DB, JsonArray, JsonObject } from 'src/database/schema.ts'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'
import type { JsonArrayImportInput } from 'src/resolvers/io-resolver.ts'
import type { Node } from 'src/resolvers/node-resolver.ts'
import { NodeType } from 'src/types.ts'

type DbValue = InsertObject<DB, 'values'>
type DbNode = InsertObject<DB, 'node'>

type Inserts = DbValue | DbNode

type TreeNode = TreeOf<Node, 'nodes'>
type JsonStart = JsonArray | JsonObject
type JsonNode = [string, any]
type Options = JsonArrayImportInput
type PathToRoot = number[]

const processJson = (
	project_id: number,
	{ external_id: extIdProp = '' }: Options,
	nodeId: AsyncGenerator<number>,
	valueId: AsyncGenerator<number>
) => {
	return async function* processNode(
		node: TreeNode,
		[key, value]: JsonNode,
		list_path: PathToRoot
	): AsyncGenerator<Inserts> {
		const node_id = node
			? node.id
			: await nodeId.next().then<number>(r => r.value)
		if (!node) {
			yield {
				id: node_id,
				name: capitalize(key),
				order: 0,
				parent_id: 0,
				project_id,
				type: NodeType.object
			} satisfies DbNode
		}
		return match<[TreeNode, JsonNode, PathToRoot], AsyncGenerator<Inserts>>(
			/* - - - - Arrays - - - - */
			caseOf(
				[{ type: NodeType.list }, [_, isArray], _],
				async function* (n, [k, v], l): AsyncGenerator<Inserts> {
					// create list items
					for (const item of v) {
						const external_id = item[extIdProp]
						const value_id = await valueId.next().then<number>(r => r.value)
						yield {
							id: value_id,
							node_id,
							value: { name: 'Item' },
							project_id,
							external_id,
							list_path,
							order: 0
						} satisfies DbValue
						yield* processNode(n, [k, item], [...list_path, value_id])
					}
				}
			),
			/* - - - - Array items - - - - */
			caseOf(
				[{ type: NodeType.list }, [_, isPlainObj], _],
				async function* (n, [k, v], l): AsyncGenerator<Inserts> {
					yield* processNode(n, [k, v], l)
				}
			),
			/* - - - - Objects - - - - */
			caseOf(
				[{ type: NodeType.object }, [_, isPlainObj], _],
				async function* (n, [k, v], l): AsyncGenerator<Inserts> {
					yield* processNode(n, [k, v], l)
				}
			)
			/* - - - - Object properties - - - - */
			// todo: handle object properties
		)(node, [key, value], list_path)
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
		)(node, ['root', json], options.list_path ?? [])
		for await (const value of generator) {
			console.log(value)
		}
	}
