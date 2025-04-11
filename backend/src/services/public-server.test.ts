import { withDatabase } from 'tests/database-test.ts'
import { describe, expect } from 'vitest'

describe('PublicServer', () => {
	withDatabase('should be defined', async ({ query }) => {
		const res = await query(
			`query {
				People(filter: { Birthdate: {year: 1976}, Management: true }) {
					Name
					Management
					Gender
					Clothing
					Age,
					Birthdate
				}
			}`
		)
		expect(res.status).toBe(200)
	})
})
