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
): Promise<ResultOf<D>> =>
	new Promise((res, rej) => {
		const unsub = gql.subscribe(
			{ query: queryDoc.toString(), variables },
			{
				next: ({ data, errors }) => {
					unsub()
					if (errors) {
						console.error(...errors)
						rej(Object.assign(new Error(), errors[0]))
					} else {
						res(data as ResultOf<D>)
					}
				},
				error: err => {
					unsub()
					console.error(err)
					throw Object.assign(new Error(), err)
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
