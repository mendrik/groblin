import type { DocumentNode } from 'graphql'
import { createClient } from 'graphql-ws'
import { isNil } from 'ramda'

const gql = createClient({ url: 'ws://localhost:8080/v1/graphql' })

export const subscribe = async <
	R,
	V extends Record<string, any> | undefined = undefined
>(
	query: DocumentNode,
	callback: <R1 extends R>(d: R1) => any,
	variables?: V
) => {
	try {
		if (isNil(query.loc?.source.body)) {
			throw new Error('Query is empty')
		}
		const subs = gql.iterate({ query: query.loc?.source.body, variables })
		for await (const { data } of subs) {
			if (data) {
				callback(data as R)
			}
		}
	} catch (e: any) {
		console.error(e)
	}
}
