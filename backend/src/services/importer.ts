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
	projectId: number,
	{ external_id: extIdProp = '' }: Options,
	nodeId: AsyncGenerator<number>,
	valueId: AsyncGenerator<number>
) => {
	return async function* processNode(
		node: TreeNode | undefined,
		[key, value]: JsonNode,
		list_path: PathToRoot
	): AsyncGenerator<Inserts> {
		if (!node) {
			const node_id = await nodeId.next()
			yield {
				id: node_id.value,
				name: capitalize(key),
				order: 0,
				parent_id: 0,
				project_id: projectId,
				type: NodeType.object
			} satisfies DbNode
		}
		return match<
			[TreeNode | undefined, JsonNode, PathToRoot],
			AsyncGenerator<Inserts>
		>(
			caseOf(
				[{ type: NodeType.list }, [_, isArray], _],
				async function* (n, [k, v], l): AsyncGenerator<Inserts> {
					// create list items
					for (const item of v) {
						const value_id = await valueId.next()
						yield {
							id: value_id.value,
							node_id: 0,
							value: item,
							project_id: projectId,
							external_id: item[extIdProp] ?? null,
							list_path,
							order: 0
						} satisfies DbValue
					}
				}
			),
			caseOf(
				[{ type: NodeType.object }, [_, isPlainObj], _],
				async function* (n, [k, v], l): AsyncGenerator<Inserts> {
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
		async function* nodeId(): AsyncGenerator<number> {
			while (true) {
				yield await sql`SELECT nextval('node_id_seq')`
					.execute(trx)
					.then<number | undefined>(path(['rows', 0, 'nextval']))
					.then(failOn(isNil, 'node_id_seq failed'))
			}
		}
		async function* valueId(): AsyncGenerator<number> {
			while (true) {
				yield await sql`SELECT nextval('values_id_seq')`
					.execute(trx)
					.then<number | undefined>(path(['rows', 0, 'nextval']))
					.then(failOn(isNil, 'node_id_seq failed'))
			}
		}
		assertExists(lastProjectId, 'lastProjectId missing')
		const generator = processJson(
			lastProjectId,
			options,
			nodeId(),
			valueId()
		)(node, ['root', json], options.list_path ?? [])
		for await (const value of generator) {
			console.log(value)
		}
	}
