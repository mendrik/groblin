import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Pool } from 'pg'

import { readFileSync } from 'node:fs'
import type { Container } from 'inversify'

declare global {
	var pool: Pool
	var container: Container
}

export default async function setup() {
	const db = await new PostgreSqlContainer('postgres:latest')
		.withDatabase('groblin')
		.withUsername('groblin')
		.withPassword('groblin')
		.start()

	const host = db.getHost()
	const port = db.getMappedPort(5432)

	process.env.DATABASE_URL = `postgresql://groblin:groblin@${host}:${port}/groblin`
	process.env.PORT = '9001'
	process.env.PUBLIC_PORT = '9002'

	const pool = new Pool({
		host,
		port,
		user: 'groblin',
		password: 'groblin',
		database: 'groblin',
		max: 10
	})

	globalThis.pool = pool

	const runSqlFile = async (file: string) => {
		const initProject = readFileSync(file, 'utf8')
		await pool.query(initProject).catch(err => {
			console.error(`Error running SQL file: ${file}`, err)
			throw err
		})
	}

	// Load and execute initial SQL data
	await runSqlFile('./database/init.sql')
	await runSqlFile('./database/test-data.sql')

	globalThis.container = await import('../src/server.ts')
		.then(({ container }) => {
			globalThis.container = container
			return container
		})
		.catch(err => {
			console.error('Error loading container', err)
			throw err
		})

	return async () => {
		await pool.end()
		await db.stop()
	}
}
