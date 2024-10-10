import { createClient } from 'graphql-ws'

const gql = createClient({ url: 'ws://localhost:8080/v1/graphql' })

export const subscribe = async <R, V extends {}>(
	query: string,
	callback: (d: R) => any,
	variables = {} as V
) => {
	try {
		const subs = gql.iterate({ query, variables })
		for await (const { data } of subs) {
			if (data) {
				callback(data as R)
			}
		}
	} catch (e: any) {
		console.error(e)
	}
}
