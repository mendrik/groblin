import { gql } from 'graphql-tag'
import { withDatabase } from 'tests/database-test.ts'
import { describe, expect } from 'vitest'

gql`query fetchPeople { People { Name } }`

describe('PublicServer', () => {
	withDatabase('Can fetch data', async ({ sdk }) => {
		const q = await sdk.fetchPeople()
		expect(q).toHaveLength(3)
	})
})
