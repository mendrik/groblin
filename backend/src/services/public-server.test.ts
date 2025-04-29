import { gql } from 'graphql-tag'
import { withDatabase } from 'tests/database-test.ts'
import { describe, expect } from 'vitest'

gql`query fetchPeople {
	People { 
		Name
		Age
		Birthdate
		Clothing
		Gender
		Management
	}
}`

gql`query fetchFiltered($filter: [PeopleFilter]) {
	People(filter: $filter) { 
		Name
	}
}`

describe('PublicServer', () => {
	withDatabase('Can fetch data', async ({ sdk }) => {
		const q = await sdk.fetchPeople()
		expect(q).toHaveLength(3)
		const { Name, Age, Birthdate, Clothing, Gender, Management } = q[0]
		expect(Name).toBe('Andreas Herd')
		expect(Age).toBe(48)
		expect(Birthdate).toBe('1976-11-14')
		expect(Clothing).toEqual([165, 131, 11, 1])
		expect(Gender).toBe('Male')
		expect(Management).toBe(true)
	})

	withDatabase('Can filter number data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Age_lte: 48 }
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Andreas Herd')
		expect(n2).toBe('Bernhard Münst')
	})

	withDatabase('Can filter string data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Name_rex: '\sM' }
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Andreas Herd')
		expect(n2).toBe('Bernhard Münst')
	})
})
