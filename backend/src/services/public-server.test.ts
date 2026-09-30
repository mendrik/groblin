import { gql } from 'graphql-tag'
import { Kysely } from 'kysely'
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
		expect(Name).toBe('Alex Example')
		expect(Age).toBe(48)
		expect(Birthdate).toBe('1976-11-14')
		expect(Clothing).toEqual([165, 131, 11, 1])
		expect(Gender).toBe('Male')
		expect(Management).toBe(true)
	})

	withDatabase('Can filter number data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Age_lte: 48 },
			order: 'Name'
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Alex Example')
		expect(n2).toBe('Blair Mock')
	})

	withDatabase('Can filter string data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Name_rex: '\\sM' },
			order: 'Name'
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Blair Mock')
		expect(n2).toBe('Casey Model')
	})

	withDatabase('Can filter color data', async ({ sdk }) => {
		const [{ Name: n1 }] = await sdk.fetchFiltered({
			filter: { Clothing: 'rgb(210,5,5)' },
			order: 'Name'
		})
		expect(n1).toBe('Casey Model')
	})

	withDatabase('Can filter choice data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Gender: 'Male' },
			order: 'Name'
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Alex Example')
		expect(n2).toBe('Blair Mock')
	})

	withDatabase('Can filter date data', async ({ sdk }) => {
		const [{ Name: n1 }, { Name: n2 }, ...r] = await sdk.fetchFiltered({
			filter: { Birthdate: { year: 1976 } },
			order: 'Name'
		})
		expect(r).toHaveLength(0)
		expect(n1).toBe('Alex Example')
		expect(n2).toBe('Casey Model')
	})
})

describe('immutable publication queries', () => {
	withDatabase(
		'snapshot filters and ordering preserve live query semantics after model deletion',
		async ({ container, sdk }) => {
			const { readContentSnapshot } = await import('./content-revisions.ts')
			const { SchemaService } = await import('./schema-service.ts')
			const { graphql } = await import('graphql')
			const db =
				container.get<Kysely<import('../database/schema.ts').DB>>(Kysely)
			const snapshot = await readContentSnapshot(db, 1)
			const row = await db
				.insertInto('content_revision')
				.values({
					project_id: 1,
					version: 0,
					author_id: null,
					author_name: 'Test',
					summary: 'Fixture',
					snapshot
				})
				.returning('id')
				.executeTakeFirstOrThrow()
			const schema = await container
				.get(SchemaService)
				.getRevisionSchema(1, row.id)
			const requests: Parameters<typeof sdk.fetchFiltered>[0][] = [
				{ filter: [{ Name_rex: '\\sM' }], order: 'Name' },
				{ filter: [{ Age_lte: 48 }], order: 'Name' },
				{ filter: [{ Clothing: 'rgb(210,5,5)' }], order: 'Name' },
				{ filter: [{ Birthdate: { year: 1976 } }], order: 'Name' }
			]
			const expected = await Promise.all(
				requests.map(request => sdk.fetchFiltered(request))
			)
			await db.deleteFrom('node').where('project_id', '=', 1).execute()
			for (const [index, variables] of requests.entries()) {
				const response = await graphql({
					schema,
					source:
						'query($filter: [PeopleFilter], $order: PeopleOrder) { People(filter: $filter, order: $order) { Name } }',
					variableValues: variables
				})
				expect(response.errors).toBeUndefined()
				expect(response.data?.People).toEqual(expected[index])
			}
		}
	)
})
