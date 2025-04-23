import 'dotenv/config'
import { prop } from 'ramda'
import 'reflect-metadata'
import { firstProperty } from '@shared/helpers.ts'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'
import { container, pool, yoga } from './test-context.ts'
import { type Sdk, getSdk } from './test-sdk.ts'

const validateRes = async (res: Response) => {
	if (!res.ok) {
		throw new Error(
			`Error: ${res.status} ${res.statusText} ${await res.text()}`
		)
	}
	return res
}

export const withDatabase = createTaskCollector((name, fn, timeout) =>
	getCurrentSuite().task(name, {
		...(this as any), // so "todo"/"skip"/... is tracked correctly
		meta: {
			transaction: true
		},
		handler: async () => {
			const sdk: Sdk = getSdk(async (query, variables, options) => {
				const res = await yoga.fetch('/graphql', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query, variables, options })
				})
				return validateRes(res)
					.then(res => res.json())
					.then(prop('data'))
					.then(firstProperty)
			})
			await pool.query('BEGIN')
			const res = await fn({ pool, container, sdk })
			await pool.query('ROLLBACK')
			return res
		},
		timeout
	})
)
