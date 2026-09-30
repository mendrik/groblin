import 'dotenv/config'
import { Client } from 'pg'
import { migrate } from '../src/services/migrations.ts'

const client = new Client({ connectionString: process.env.DATABASE_URL })
try {
	await client.connect()
	const count = await migrate(client)
	console.log(
		JSON.stringify({ event: 'migrations_complete', migrations: count })
	)
} catch (error) {
	console.error(
		JSON.stringify({
			event: 'migrations_failed',
			message: error instanceof Error ? error.message : 'Migration failed'
		})
	)
	process.exitCode = 1
} finally {
	await client.end()
}
