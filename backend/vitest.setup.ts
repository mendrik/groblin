// vitest.setup.ts

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool } from 'pg'
import { GenericContainer, type StartedTestContainer } from 'testcontainers'
import { afterAll, beforeAll } from 'vitest'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'

declare global {
	var container: StartedTestContainer
	var pool: Pool
}

const runSqlFile = async (file: string) => {
	const initProject = readFileSync(join(__dirname, file), 'utf8')

	await globalThis.pool
		.query(initProject)
		.then(() => console.log(`Ran SQL file: ${file}`))
		.catch(err => {
			console.error(`Error running SQL file: ${file}`, err)
			throw err
		})
}

export const txTest = createTaskCollector((name, fn, timeout) => {
	getCurrentSuite().task(name, {
		...(this as any), // so "todo"/"skip"/... is tracked correctly
		meta: {
			transaction: true
		},
		handler: async () => {
			await globalThis.pool.query('BEGIN')
			const res = await fn()
			await globalThis.pool.query('ROLLBACK')
			return res
		},
		timeout
	})
})

beforeAll(async () => {
	globalThis.container = await new GenericContainer('postgres')
		.withEnvironment({
			POSTGRES_USER: 'groblin',
			POSTGRES_PASSWORD: 'groblin',
			POSTGRES_DB: 'groblin'
		})
		.withExposedPorts(5432)
		.start()

	const host = globalThis.container.getHost()
	const port = globalThis.container.getMappedPort(5432)

	globalThis.pool = await new Pool({
		host,
		port,
		user: 'groblin',
		password: 'groblin',
		database: 'groblin'
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
