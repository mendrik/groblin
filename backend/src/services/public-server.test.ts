import { gql } from 'graphql-tag'
import { withDatabase } from 'tests/database-test.ts'
import { Gender, PeopleOrder } from 'tests/test-sdk.ts'
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

gql`query fetchFiltered($filter: [PeopleFilter], $order: PeopleOrder) {
	People(filter: $filter, order: $order) { 
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
			filter: { Age_lte: 48 },
			order: PeopleOrder.Name
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Andreas Herd')
		expect(n2).toBe('Bernhard Münst')
	})

	withDatabase('Can filter string data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Name_rex: '\\sM' },
			order: PeopleOrder.Name
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Bernhard Münst')
		expect(n2).toBe('Michael C. Maurer')
	})

	withDatabase('Can filter color data', async ({ sdk }) => {
		const [{ Name: n1 }] = await sdk.fetchFiltered({
			filter: { Clothing: 'rgb(210,5,5)' },
			order: PeopleOrder.Name
		})
		expect(n1).toBe('Michael C. Maurer')
	})

	withDatabase('Can filter choice data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Gender: Gender.Male },
			order: PeopleOrder.Name
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Andreas Herd')
		expect(n2).toBe('Bernhard Münst')
	})

	withDatabase('Can filter date data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Birthdate: { year: 1976 } },
			order: PeopleOrder.Name
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Andreas Herd')
		expect(n2).toBe('Michael C. Maurer')
	})
})
