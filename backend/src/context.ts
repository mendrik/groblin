import type { Kysely } from 'kysely'
import type { PubSub } from 'type-graphql'
import { db } from './database.ts'
import type { DB } from './database/schema.ts'
import { pubSub } from './pubsub.ts'

export interface Context {
	db: Kysely<DB>
	pubSub: PubSub
}

const context: Context = {
	db,
	pubSub
}

export { context }
