import { createClient } from 'graphql-ws'

const gql = createClient({ url: 'ws://localhost:8080/v1/graphql' })

export const subscribe = async <
	R,
	V extends Record<string, any> | undefined = undefined
>(
	query: string,
	callback: <R1 extends R>(d: R1) => any,
	variables?: V
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
