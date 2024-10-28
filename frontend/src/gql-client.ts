import type { ResultOf, VariablesOf } from '@graphql-typed-document-node/core'
import { createClient } from 'graphql-ws'
import type { TypedDocumentString } from './gql/graphql'

const gql = createClient({ url: 'ws://localhost:6173/graphql' })

export const subscribe = async <D extends TypedDocumentString<any, any>>(
	query: D,
	callback: (d: ResultOf<D>) => any,
	variables?: VariablesOf<D>
) => {
	try {
		const subs = gql.iterate({
			query: query.toString(),
			variables: variables ?? undefined
		})
		for await (const { data } of subs) {
			if (data) {
				callback(data as ResultOf<D>)
			}
		}
	} catch (e: any) {
		console.error(e)
	}
}

export const query = async <D extends TypedDocumentString<any, any>>(
	query: D,
	variables?: VariablesOf<D>
): Promise<ResultOf<D>> =>
	new Promise((res, rej) => {
		const unsub = gql.subscribe(
			{ query: query.toString(), variables: variables ?? undefined },
			{
				next: ({ data }) => res(data as ResultOf<D>),
				error: err =>
					rej(new Error(`${query.__meta__?.$name}:`, { cause: err })),
				complete: () => unsub()
			}
		)
	})
