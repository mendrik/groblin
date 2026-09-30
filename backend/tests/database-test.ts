import { firstProperty } from '@shared/helpers.ts'
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { print } from 'graphql'
import type { Container } from 'inversify'
import type { PoolClient } from 'pg'
import { afterAll, beforeAll, test } from 'vitest'
import type { CustomSdk } from './global.ts'
import { createTestContext, Pool, startDatabase } from './test-context.ts'
import { getSdk } from './test-sdk.ts'

let database: StartedPostgreSqlContainer
let pool: Pool
beforeAll(async () => {
	database = await startDatabase()
	pool = new Pool({ connectionString: database.getConnectionUri() })
}, 120000)
afterAll(async () => {
	await pool?.end()
	await database?.stop()
})

export const withDatabase = test.extend<{
	pool: PoolClient
	container: Container
	sdk: CustomSdk
}>({
	pool: async ({ task: _task }, use) => {
		const client = await pool.connect()
		try {
			await client.query('BEGIN')
			await use(client)
		} finally {
			await client.query('ROLLBACK')
			client.release()
		}
	},
	container: async ({ pool }, use) => {
		const context = await createTestContext(pool)
		try {
			await use(context.container)
		} finally {
			await context.db.destroy()
		}
	},
	sdk: async ({ pool }, use) => {
		const context = await createTestContext(pool)
		const sdk = getSdk(async (query, variables) => {
			const response = await context.yoga.fetch('http://localhost/graphql', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: print(query), variables })
			})
			const result = await response.json()
			if (!response.ok || result.errors)
				throw new Error(JSON.stringify(result.errors))
			return firstProperty(result.data)
		}) as unknown as CustomSdk
		try {
			await use(sdk)
		} finally {
			await context.db.destroy()
		}
	}
})
