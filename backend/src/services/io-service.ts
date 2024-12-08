import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { inject, injectable } from 'inversify'
import type { Transaction } from 'kysely'
import type { DB, Json } from 'src/database/schema.ts'
import { type Node, NodeResolver } from '../resolvers/node-resolver.ts'
import { compareStructure } from './json.ts'

@injectable()
export class IoService {
	@inject(NodeResolver)
	private readonly nodeResolver: NodeResolver

	async ensureStructure(
		trx: Transaction<DB>,
		node: TreeOf<Node, 'nodes'>,
		json: Json
	) {
		const result = [...compareStructure(node, json)]
		console.log(result)
	}
}
