/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
	| T
	| {
			[P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never
	  }

import type { DocumentNode, ExecutionResult } from 'graphql'
import { gql } from 'graphql-tag'
export type DateInput = {
	day?: number | null | undefined
	month?: number | null | undefined
	year?: number | null | undefined
}

export type Gender = 'Female' | 'Male'

export type PeopleFilter = {
	Age?: number | null | undefined
	Age_gt?: number | null | undefined
	Age_gte?: number | null | undefined
	Age_lt?: number | null | undefined
	Age_lte?: number | null | undefined
	Age_not?: number | null | undefined
	Birthdate?: DateInput | null | undefined
	Birthdate_gt?: DateInput | null | undefined
	Birthdate_gte?: DateInput | null | undefined
	Birthdate_lt?: DateInput | null | undefined
	Birthdate_lte?: DateInput | null | undefined
	Birthdate_not?: DateInput | null | undefined
	Clothing?: string | null | undefined
	Clothing_not?: string | null | undefined
	Gender?: Gender | null | undefined
	Gender_not?: Gender | null | undefined
	Management?: boolean | null | undefined
	Name?: string | null | undefined
	Name_not?: string | null | undefined
	Name_rex?: string | null | undefined
}

export type PeopleOrder =
	| 'Age'
	| 'Birthdate'
	| 'Clothing'
	| 'Gender'
	| 'Management'
	| 'Name'

export type FetchPeopleQueryVariables = Exact<{ [key: string]: never }>

export type FetchPeopleQuery = {
	People: Array<{
		Name: string | null
		Age: number | null
		Birthdate: string | null
		Clothing: Array<number | null> | null
		Gender: Gender | null
		Management: boolean | null
	} | null> | null
}

export type FetchFilteredQueryVariables = Exact<{
	filter?:
		| Array<PeopleFilter | null | undefined>
		| PeopleFilter
		| null
		| undefined
	order?: PeopleOrder | null | undefined
}>

export type FetchFilteredQuery = {
	People: Array<{ Name: string | null } | null> | null
}

export const FetchPeopleDocument = gql`
    query fetchPeople {
  People {
    Name
    Age
    Birthdate
    Clothing
    Gender
    Management
  }
}
    `
export const FetchFilteredDocument = gql`
    query fetchFiltered($filter: [PeopleFilter], $order: PeopleOrder) {
  People(filter: $filter, order: $order) {
    Name
  }
}
    `
export type Requester<C = {}, E = unknown> = <R, V>(
	doc: DocumentNode,
	vars?: V,
	options?: C
) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
	return {
		fetchPeople(
			variables?: FetchPeopleQueryVariables,
			options?: C
		): Promise<ExecutionResult<FetchPeopleQuery, E>> {
			return requester<FetchPeopleQuery, FetchPeopleQueryVariables>(
				FetchPeopleDocument,
				variables,
				options
			) as Promise<ExecutionResult<FetchPeopleQuery, E>>
		},
		fetchFiltered(
			variables?: FetchFilteredQueryVariables,
			options?: C
		): Promise<ExecutionResult<FetchFilteredQuery, E>> {
			return requester<FetchFilteredQuery, FetchFilteredQueryVariables>(
				FetchFilteredDocument,
				variables,
				options
			) as Promise<ExecutionResult<FetchFilteredQuery, E>>
		}
	}
}
export type Sdk = ReturnType<typeof getSdk>
