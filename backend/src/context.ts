import type { Kysely } from 'kysely'
import type { PubSub } from 'type-graphql'
import { db } from './database.ts'
import type { DB } from './database/schema.ts'
import { pubSub } from './pubsub.ts'
import type { LoggedInUser } from './resolvers/auth-resolver.ts'

export interface Context {
	db: Kysely<DB>
	pubSub: PubSub
	extra: Required<LoggedInUser>
}

const context: Context = {
	db,
	pubSub,
	extra: undefined as any
}

export { context }
