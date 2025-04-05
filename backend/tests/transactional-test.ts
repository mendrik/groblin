import { Pool } from 'pg'
import { inject } from 'vitest'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'

const pool = new Pool({
	host: inject('dbHost'),
	port: inject('dbPort'),
	user: 'groblin',
	password: 'groblin',
	database: 'groblin',
	max: 10
})

export const txTest = createTaskCollector((name, fn, timeout) => {
	getCurrentSuite().task(name, {
		...(this as any), // so "todo"/"skip"/... is tracked correctly
		meta: {
			transaction: true
		},
		handler: async () => {
			await pool.query('BEGIN')
			const res = await fn()
			await pool.query('ROLLBACK')
			return res
		},
		timeout
	})
})
