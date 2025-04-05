import { PostgreSqlContainer } from '@testcontainers/postgresql'
import type { TestProject } from 'vitest/node'

import { readFileSync } from 'node:fs'
import { Pool } from 'pg'

declare module 'vitest' {
	export interface ProvidedContext {
		dbPort: number
		dbHost: string
	}
}
export default async function setup(project: TestProject) {
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
		max: 1
	})

	project.provide('dbHost', host)
	project.provide('dbPort', port)

	const runSqlFile = async (file: string) => {
		const initProject = readFileSync(file, 'utf8')
		await pool.query(initProject).catch((err: Error) => {
			console.error(`Error running SQL file: ${file}`, err)
			throw err
		})
	}

	// Load and execute initial SQL data
	await runSqlFile('./database/init.sql')
	await runSqlFile('./database/test-data.sql')

	await pool.end()

	const shutdown = async () => {
		await db.stop()
		await pool.end()
	}

	return shutdown
}
