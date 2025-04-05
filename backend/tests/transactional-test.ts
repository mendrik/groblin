import type { Pool } from 'pg'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'

declare global {
	var pool: Pool
}

export const txTest = createTaskCollector((name, fn, timeout) => {
	getCurrentSuite().task(name, {
		...(this as any), // so "todo"/"skip"/... is tracked correctly
		meta: {
			transaction: true
		},
		handler: async () => {
			await globalThis.pool.query('BEGIN')
			const res = await fn()
			await globalThis.pool.query('ROLLBACK')
			return res
		},
		timeout
	})
})
