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
			{ query: queryDoc.toString(), variables: variables ?? undefined },
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

export const subscribe = async <
	Q extends TypedDocumentString<any, any>,
	S extends TypedDocumentString<any, any>
>(
	queryDoc: Q,
	subscriptionDoc: S,
	callback: (data: ResultOf<Q>) => void,
	variables?: VariablesOf<Q>
) => {
	const run = () =>
		query(queryDoc, variables).then(callback).catch(console.error)
	try {
		run()
		const subs = gql.iterate({
			query: subscriptionDoc.toString()
		})
		for await (const { data } of subs) {
			if (data) run()
		}
	} catch (e: any) {
		console.error(e)
	}
}
