import { gql } from 'graphql-tag'
import { head } from 'ramda'
import { withDatabase } from 'tests/database-test.ts'
import { describe, expect } from 'vitest'

describe('PublicServer', () => {
	withDatabase('Can fetch data', async ({ query }) => {
		const q = gql`query { People { Name } }`
		//const people = await query(q).then(d => d.People)
		//expect(people).toHaveLength(3)
	})

	withDatabase('Can fetch data numbers', async ({ query }) => {
		const p = await query(`query { People { Age } }`)
			.then(d => d.People)
			.then(head<any>)
		expect(p.Age).toHaveLength(3)
	})
})
