import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool, type PoolClient } from 'pg'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import { startDatabase } from '../../tests/test-context.ts'
import type { DB } from '../database/schema.ts'
import { lockProject } from './model-validation.ts'

let postgres: StartedPostgreSqlContainer
let pool: Pool
beforeAll(async () => {
	postgres = await startDatabase()
	pool = new Pool({ connectionString: postgres.getConnectionUri() })
}, 120000)
afterAll(async () => {
	await pool?.end()
	await postgres?.stop()
})
const databaseFor = (client: PoolClient) =>
	new Kysely<DB>({
		dialect: new PostgresDialect({
			pool: {
				options: {},
				end: async () => {},
				connect: async () => ({
					query: client.query.bind(client),
					release: () => {}
				})
			}
		})
	})

test('the project lock serializes writers on separate PostgreSQL connections', async () => {
	const first = await pool.connect(),
		second = await pool.connect()
	const firstDb = databaseFor(first),
		secondDb = databaseFor(second)
	try {
		await first.query('BEGIN')
		await second.query('BEGIN')
		const {
			rows: [{ pid }]
		} = await second.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')
		await lockProject(firstDb, 1)
		let acquired = false
		const waiting = lockProject(secondDb, 1).then(() => {
			acquired = true
		})
		await vi.waitFor(async () => {
			const result = await pool.query<{ wait_event_type: string }>(
				'SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1',
				[pid]
			)
			expect(result.rows[0]?.wait_event_type).toBe('Lock')
		})
		expect(acquired).toBe(false)
		await first.query('ROLLBACK')
		await waiting
		expect(acquired).toBe(true)
	} finally {
		await first.query('ROLLBACK')
		await second.query('ROLLBACK')
		await firstDb.destroy()
		await secondDb.destroy()
		first.release()
		second.release()
	}
})
