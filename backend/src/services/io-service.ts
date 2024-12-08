import { injectable } from 'inversify'
import type { Transaction } from 'kysely'
import type { DB, Json } from 'src/database/schema.ts'

type LastProjectId = number

@injectable()
export class IoService {
	async ensureStructure(trx: Transaction<DB>, nodeId: number, json: Json) {}
}
