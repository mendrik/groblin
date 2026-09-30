import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const database = resolve(import.meta.dirname, '../database')
const names = (await readdir(resolve(database, 'migrations')))
	.filter(name => /^\d{3}-.+\.sql$/.test(name))
	.sort()
const parts = [await readFile(resolve(database, 'base.sql'), 'utf8')]
for (const name of names)
	if (!name.startsWith('001-'))
		parts.push(await readFile(resolve(database, 'migrations', name), 'utf8'))
parts.push(await readFile(resolve(database, 'migration-ledger.sql'), 'utf8'))
await writeFile(resolve(database, 'init.sql'), parts.join('\n'))
