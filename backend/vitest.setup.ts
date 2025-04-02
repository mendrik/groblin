// vitest.setup.ts

import { spawn } from 'node:child_process'
import { Pool } from 'pg'
import { GenericContainer } from 'testcontainers'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

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

beforeEach(async () => {
	await globalThis.pool.query('BEGIN')
})

afterEach(async () => {
	await globalThis.pool.query('ROLLBACK')
})

afterAll(async () => {
	await globalThis.pool.end()
	await globalThis.container.stop()
})
