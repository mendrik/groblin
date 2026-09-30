import { Kysely, PostgresDialect } from 'kysely'
import type { PoolClient } from 'pg'
import type { DB } from '../src/database/schema.ts'

/** Keep resolver transactions inside the test's BEGIN/ROLLBACK using real PostgreSQL savepoints. */
export function createRollbackDatabase(client: PoolClient) {
	let turn = Promise.resolve()
	return new Kysely<DB>({
		dialect: new PostgresDialect({
			pool: {
				options: {},
				end: async () => {},
				connect: async () => {
					const previous = turn
					let release: () => void = () => {}
					turn = new Promise<void>(resolve => {
						release = resolve
					})
					await previous
					return new Proxy(client, {
						get: (target, key) => {
							if (key === 'release') return release
							if (key !== 'query') return Reflect.get(target, key)
							return async (
								query: string,
								parameters: readonly unknown[] = []
							) => {
								if (/^(begin|start transaction)\b/i.test(query))
									return client.query('SAVEPOINT test_mutation')
								if (/^commit\b/i.test(query))
									return client.query('RELEASE SAVEPOINT test_mutation')
								if (/^rollback\b/i.test(query)) {
									await client.query('ROLLBACK TO SAVEPOINT test_mutation')
									return client.query('RELEASE SAVEPOINT test_mutation')
								}
								// Expected constraint errors must not poison the enclosing test transaction.
								await client.query('SAVEPOINT test_statement')
								try {
									const result = await client.query(
										query,
										Array.from(parameters)
									)
									await client.query('RELEASE SAVEPOINT test_statement')
									return result
								} catch (error) {
									await client.query('ROLLBACK TO SAVEPOINT test_statement')
									await client.query('RELEASE SAVEPOINT test_statement')
									throw error
								}
							}
						}
					})
				}
			}
		})
	})
}
