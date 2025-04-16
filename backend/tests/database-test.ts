import 'dotenv/config'
import { prop } from 'ramda'
import 'reflect-metadata'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'
import { container, pool, yoga } from './test-context.ts'

const query = async (query: string) => {
	const res = await yoga.fetch('/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	})
	if (!res.ok) {
		throw new Error(
			`Error: ${res.status} ${res.statusText} ${await res.text()}`
		)
	}
	return res.json().then(prop('data'))
}

export const withDatabase = createTaskCollector((name, fn, timeout) =>
	getCurrentSuite().task(name, {
		...(this as any), // so "todo"/"skip"/... is tracked correctly
		meta: {
			transaction: true
		},
		handler: async () => {
			await pool.query('BEGIN')
			const res = await fn({ pool, container, query })
			await pool.query('ROLLBACK')
			return res
		},
		timeout
	})
)
