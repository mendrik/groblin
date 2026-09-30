import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

const database = await new PostgreSqlContainer('postgres:17-alpine')
	.withUsername('groblin')
	.withCopyFilesToContainer([
		{
			source: fileURLToPath(new URL('../database/init.sql', import.meta.url)),
			target: '/docker-entrypoint-initdb.d/01-schema.sql'
		}
	])
	.start()
try {
	await new Promise<void>((resolve, reject) => {
		const process = spawn(
			'pnpm',
			[
				'exec',
				'kysely-codegen',
				'--out-file',
				'src/database/schema.ts',
				'--dialect',
				'postgres'
			],
			{
				cwd: fileURLToPath(new URL('..', import.meta.url)),
				env: {
					...globalThis.process.env,
					DATABASE_URL: database.getConnectionUri()
				},
				stdio: 'inherit'
			}
		)
		process.on('error', reject)
		process.on('exit', code =>
			code === 0
				? resolve()
				: reject(new Error(`Database codegen exited with ${code}`))
		)
	})
} finally {
	await database.stop()
}
