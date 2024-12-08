import { injectable } from 'inversify'
import type { Transaction } from 'kysely'
import type { DB, Json } from 'src/database/schema.ts'
import type { Node } from '../resolvers/node-resolver.ts'
import { traverse } from './json.ts'

@injectable()
export class IoService {
	async ensureStructure(trx: Transaction<DB>, node: Node, json: Json) {
		for (const { key, value } of traverse(json)) {
			console.log(key, value)
		}
	}
}
