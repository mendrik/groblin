import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import { Client } from 'pg'
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	test
} from 'vitest'
import { migrate, migrationFiles } from './migrations.ts'

let postgres: StartedPostgreSqlContainer
let client: Client
beforeAll(async () => {
	postgres = await new PostgreSqlContainer('postgres:17-alpine')
		.withUsername('groblin')
		.start()
}, 30000)
beforeEach(async () => {
	client = new Client({ connectionString: postgres.getConnectionUri() })
	await client.connect()
	await client.query('BEGIN')
})
afterEach(async () => {
	await client.query('ROLLBACK')
	await client.end()
})
afterAll(async () => {
	await postgres.stop()
})
test('fresh installation applies a tracked schema and a second run changes nothing', async () => {
	expect(await migrate(client, true)).toBe(10)
	const first = await client.query(
		'SELECT * FROM public.schema_migration ORDER BY version'
	)
	await migrate(client, true)
	expect(
		(
			await client.query(
				'SELECT * FROM public.schema_migration ORDER BY version'
			)
		).rows
	).toEqual(first.rows)
	expect(
		(await client.query("SELECT to_regclass('public.media_asset') AS present"))
			.rows[0].present
	).toBeTruthy()
})
test('the previous schema upgrades in place and revokes plaintext keys', async () => {
	const base = await readFile(
		resolve(import.meta.dirname, '../../database/base.sql'),
		'utf8'
	)
	await client.query(base)
	await client.query('SET search_path TO public')
	await client.query(
		"INSERT INTO project (id,name) VALUES (1,'Legacy'); INSERT INTO api_key (project_id,name,key,is_active) VALUES (1,'Exposed','synthetic-legacy-key',true)"
	)
	await client.query(`
		INSERT INTO node(id,name,type,"order",parent_id,project_id) VALUES
			(10,'Legacy','Root',0,NULL,1),(11,'Title','String',0,10,1);
		INSERT INTO "values"(node_id,value,project_id) VALUES (11,'{"content":"Keep legacy content"}',1);
		INSERT INTO node_settings(node_id,settings,project_id) VALUES (11,'{"hideColumnHead":true}',1);
	`)
	await migrate(client, true)
	expect(
		(await client.query('SELECT name,key,is_active FROM public.api_key')).rows
	).toEqual([{ name: 'Exposed', key: 'revoked:1', is_active: false }])
	expect(
		(await client.query('SELECT name,version FROM public.project')).rows
	).toEqual([{ name: 'Legacy', version: 0 }])
	expect(
		(await client.query('SELECT node_id,value,project_id FROM public."values"'))
			.rows
	).toEqual([
		{ node_id: 11, value: { content: 'Keep legacy content' }, project_id: 1 }
	])
	expect(
		(
			await client.query(
				'SELECT node_id,settings,project_id FROM public.node_settings'
			)
		).rows
	).toEqual([{ node_id: 11, settings: { hideColumnHead: true }, project_id: 1 }])
})
test('changed migration checksums and database downgrades fail explicitly', async () => {
	await migrate(client, true)
	await client.query(
		"UPDATE public.schema_migration SET checksum='changed' WHERE version=1"
	)
	await expect(migrate(client, true)).rejects.toThrow('checksum changed')
	const [first] = await migrationFiles()
	if (!first) throw new Error('Missing migration')
	await client.query(
		'UPDATE public.schema_migration SET checksum=$1 WHERE version=1',
		[first.checksum]
	)
	await client.query(
		"INSERT INTO public.schema_migration(version,name,checksum) VALUES (99,'future','future')"
	)
	await expect(migrate(client, true)).rejects.toThrow('newer than this release')
})
