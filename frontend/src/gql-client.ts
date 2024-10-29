import type { ResultOf, VariablesOf } from '@graphql-typed-document-node/core'
import { createClient } from 'graphql-ws'
import type { TypedDocumentString } from './gql/graphql'

const gql = createClient({
	url: 'ws://localhost:6173/graphql'
})

export const query = async <D extends TypedDocumentString<any, any>>(
	queryDoc: D,
	variables?: VariablesOf<D>
): Promise<ResultOf<D>> =>
	new Promise((res, rej) => {
		const unsub = gql.subscribe(
			{ query: queryDoc.toString(), variables },
			{
				next: ({ data, errors }) => {
					unsub()
					errors ? rej(errors) : res(data as ResultOf<D>)
				},
				error: err => {
					unsub()
					rej(new Error(`${queryDoc.__meta__?.$name}:`, { cause: err }))
				},
				complete: () => unsub()
			}
		)
	})

export const subscribe = async <S extends TypedDocumentString<any, any>>(
	subscriptionDoc: S,
	callback: (data: ResultOf<S>) => void,
	variables?: VariablesOf<S>
) => {
	try {
		const subs = gql.iterate({
			query: subscriptionDoc.toString(),
			variables
		})
		for await (const { data } of subs) {
			if (data) callback(data as ResultOf<S>)
		}
	} catch (e: any) {
		console.error(e)
	}
}
