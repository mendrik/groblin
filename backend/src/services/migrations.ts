import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Client } from 'pg'

const directory = resolve(import.meta.dirname, '../../database')
export async function migrationFiles() {
	const names = (await readdir(resolve(directory, 'migrations')))
		.filter(name => /^\d{3}-.+\.sql$/.test(name))
		.sort()
	return Promise.all(
		names.map(async name => {
			const source = await readFile(
				resolve(directory, 'migrations', name),
				'utf8'
			)
			return {
				name,
				version: Number(name.slice(0, 3)),
				checksum: createHash('sha256').update(source).digest('hex'),
				source: source.replace(/^(BEGIN;|COMMIT;)\s*$/gm, '')
			}
		})
	)
}
export async function migrate(client: Client, nested = false) {
	await client.query('SELECT pg_advisory_lock(716238945)')
	try {
		await client.query(
			await readFile(resolve(directory, 'migration-ledger.sql'), 'utf8')
		)
		const files = await migrationFiles()
		const existing = await client.query<{ version: number; checksum: string }>(
			'SELECT version, checksum FROM public.schema_migration ORDER BY version'
		)
		if (
			existing.rows.some(
				row => !files.some(file => file.version === row.version)
			)
		)
			throw new Error(
				'Database is newer than this release; downgrades are unsupported'
			)
		for (const file of files) {
			const applied = existing.rows.find(row => row.version === file.version)
			if (applied) {
				if (applied.checksum !== file.checksum)
					throw new Error(`Migration checksum changed: ${file.name}`)
				continue
			}
			await client.query(nested ? 'SAVEPOINT groblin_migration' : 'BEGIN')
			try {
				if (file.version === 1) {
					const tables = await client.query<{ present: string | null }>(
						"SELECT to_regclass('public.project')::text AS present"
					)
					if (!tables.rows[0]?.present)
						await client.query(
							await readFile(resolve(directory, 'base.sql'), 'utf8')
						)
					else {
						const revision = await client.query(
							"SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project' AND column_name='version'"
						)
						if (revision.rowCount)
							throw new Error(
								'Untracked modern database: restore a backup with its migration ledger, or start a fresh database. See the upgrade guide.'
							)
						const isolated = await client.query(
							"SELECT 1 FROM pg_constraint WHERE conname='node_project_identity' AND conrelid='public.node'::regclass"
						)
						if (!isolated.rowCount) await client.query(file.source)
					}
				} else await client.query(file.source)
				await client.query(
					'INSERT INTO public.schema_migration(version,name,checksum) VALUES ($1,$2,$3)',
					[file.version, file.name, file.checksum]
				)
				await client.query(
					nested ? 'RELEASE SAVEPOINT groblin_migration' : 'COMMIT'
				)
			} catch (error) {
				await client.query(
					nested ? 'ROLLBACK TO SAVEPOINT groblin_migration' : 'ROLLBACK'
				)
				throw error
			}
		}
		await client.query('SET search_path TO public')
		return files.length
	} finally {
		await client.query('SELECT pg_advisory_unlock(716238945)')
	}
}
