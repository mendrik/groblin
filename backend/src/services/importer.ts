import { assertExists } from '@shared/asserts.ts'
import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { capitalize } from '@shared/utils/ramda.ts'
import type { InsertObject, Transaction } from 'kysely'
import { T as _ } from 'ramda'
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
	projectId: number,
	{ external_id: extIdProp = '' }: Options
) => {
	return function* processNode(
		node: TreeNode | undefined,
		[key, value]: JsonNode,
		list_path: PathToRoot
	): Generator<Inserts> {
		if (!node) {
			yield {
				name: capitalize(key),
				order: 0,
				parent_id: 0,
				project_id: projectId,
				type: NodeType.object
			} satisfies DbNode
		}
		return match<
			[TreeNode | undefined, JsonNode, PathToRoot],
			Generator<Inserts>
		>(
			caseOf(
				[{ type: NodeType.list }, [_, isArray], _],
				function* (n, [k, v], l): Generator<Inserts> {
					for (const item of v) {
						yield {
							node_id: 0,
							value: item,
							project_id: projectId,
							external_id: item[extIdProp] ?? null,
							list_path: [],
							order: 0
						} satisfies DbValue
					}
				}
			),
			caseOf(
				[{ type: NodeType.object }, [_, isPlainObj], _],
				function* (n, [k, v], l): Generator<Inserts> {
					yield* processNode(n, [k, v], l)
				}
			)
		)(node, [key, value], list_path)
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
		const importData = [
			...processJson(lastProjectId, options)(node, ['root', json], [])
		]
		console.log(importData)
	}
