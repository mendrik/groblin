import { path } from 'ramda'
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
		).then(path(['data', 'People']))
		expect(res).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'Andreas Herd',
					Birthdate: '1976-11-14',
					Clothing: [165, 131, 11, 1],
					Management: true,
					Gender: 'Male',
					Age: 48
				})
			])
		)
	})
})
