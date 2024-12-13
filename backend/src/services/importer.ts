import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import type { InsertObject, Transaction } from 'kysely'
import { T as _ } from 'ramda'
import { isArray, isPlainObj } from 'ramda-adjunct'
import type { DB, JsonArray, JsonObject } from 'src/database/schema.ts'
import type { JsonArrayImportInput } from 'src/resolvers/io-resolver.ts'
import type { Node } from 'src/resolvers/node-resolver.ts'
import { NodeType } from 'src/types.ts'

type Inserts = {
	values: InsertObject<DB, 'values'>
	nodes: InsertObject<DB, 'node'>
}

type TreeNode = TreeOf<Node, 'nodes'>
type JsonStart = JsonArray | JsonObject
type JsonNode = [string, any]
type Options = JsonArrayImportInput
type PathToRoot = number[]

function* processNodes(
	node: TreeNode,
	value: unknown,
	list_path: PathToRoot
): Generator<Inserts> {
	const iterator = match<[TreeNode, JsonNode, PathToRoot], Generator<Inserts>>(
		caseOf(
			[{ type: NodeType.list }, [_, isArray], _],
			function* (n, [k, v], l) {
				yield* processNodes(n, [k, v], l)
			}
		),
		caseOf(
			[{ type: NodeType.object }, [_, isPlainObj], _],
			function* (n, [k, v], l) {
				yield* processNodes(n, [k, v], l)
			}
		),
		caseOf([_, _, _], function* () {})
	)
	yield* iterator(node, ['root', value], list_path)
}

export const importJson =
	(json: JsonStart, node: TreeNode, options: Options) =>
	async (trx: Transaction<DB>): Promise<void> => {}
