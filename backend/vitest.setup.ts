// vitest.setup.ts

import { spawn } from 'node:child_process'
import { Pool } from 'pg'
import { GenericContainer, type StartedTestContainer } from 'testcontainers'
import { afterAll, beforeAll } from 'vitest'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'

declare global {
	var container: StartedTestContainer
	var pool: Pool
}

export const txTest = createTaskCollector((name, fn, timeout) => {
	getCurrentSuite().task(name, {
		...this as any, // so "todo"/"skip"/... is tracked correctly
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
			POSTGRES_USER: 'test',
			POSTGRES_PASSWORD: 'test'
		})
		.withExposedPorts(5432)
		.start()

	const host = globalThis.container.getHost()
	const port = globalThis.container.getMappedPort(5432)

	globalThis.pool = await new Pool({
		host,
		port,
		user: 'test',
		password: 'test',
		database: 'postgres'
	})

	const child = spawn('tsx', ['src/server.ts'], {
		stdio: 'inherit'
	})
})

afterAll(async () => {
	await globalThis.pool.end()
	await globalThis.container.stop()
})
