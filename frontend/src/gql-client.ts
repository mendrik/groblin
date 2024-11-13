import type { ResultOf, VariablesOf } from '@graphql-typed-document-node/core'
import { createClient } from 'graphql-ws'
import type { TypedDocumentString } from './gql/graphql'
import { getItem } from './lib/local-storage'

const gql = createClient({
	url: 'ws://localhost:6173/graphql',
	connectionParams: () => ({
		authToken: getItem('token')
	})
})

export const query = async <D extends TypedDocumentString<any, any>>(
	queryDoc: D,
	variables?: VariablesOf<D>
): Promise<ResultOf<D>> => {
	const query = gql.iterate({ query: queryDoc.toString(), variables })
	return query.next().then(({ value }) => value.data as ResultOf<D>)
}

export const subscribe = async <S extends TypedDocumentString<any, any>>(
	subscriptionDoc: S,
	callback: (data: ResultOf<S>) => void,
	variables?: VariablesOf<S>
) => {
	const subs = gql.iterate({
		query: subscriptionDoc.toString(),
		variables
	})
	for await (const { data } of subs) {
		if (data) callback(data as ResultOf<S>)
	}
}
