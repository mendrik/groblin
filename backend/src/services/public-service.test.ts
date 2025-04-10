import { txTest } from 'tests/transactional-test.ts'
import { describe } from 'vitest'

describe('PublicService', () => {
	txTest('should be defined', async ({ yoga }) => {
		const res = await yoga.fetch('/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `query {
					__schema {
						queryType {
							name
						}
					}
				}`
			})
		})

		console.log(res)
	})
})
