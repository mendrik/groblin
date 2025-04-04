import { spawn } from 'node:child_process'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Pool } from 'pg'

import { readFileSync } from 'node:fs'
import type { StartedTestContainer } from 'testcontainers'
import { afterAll, beforeAll } from 'vitest'

declare global {
	var container: StartedTestContainer
	var pool: Pool
}

export const runSqlFile = async (file: string) => {
	const initProject = readFileSync(file, 'utf8')
	await globalThis.pool
		.query(initProject)
		.then(() => console.log(`Ran SQL file: ${file}`))
		.catch(err => {
			console.error(`Error running SQL file: ${file}`, err)
			throw err
		})
}

beforeAll(async () => {
	const container = new PostgreSqlContainer('postgres:latest')
		.withDatabase('groblin')
		.withUsername('groblin')
		.withPassword('groblin')
	globalThis.container = await container.start()

	const host = globalThis.container.getHost()
	const port = globalThis.container.getMappedPort(5432)

	globalThis.pool = new Pool({
		host,
		port,
		user: 'groblin',
		password: 'groblin',
		database: 'groblin',
		max: 10
	})

	// Load and execute initial SQL data
	await runSqlFile('./database/init.sql')
	await runSqlFile('./database/test-data.sql')
	const child = spawn('tsx', ['src/server.ts'], {
		stdio: 'inherit'
	})
})

afterAll(async () => {
	await globalThis.pool.end()
	await globalThis.container.stop()
})
