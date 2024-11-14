import { type ExecutionResult, createClient } from 'graphql-ws'
import { type Requester, type Sdk, getSdk } from './gql/graphql'
import { getItem } from './lib/local-storage'

const gql = createClient({
	url: 'ws://localhost:6173/graphql',
	connectionParams: () => ({
		authToken: getItem('token')
	})
})

type Options = {
	callback?: <V>(data: V) => void
}

const query: Requester = async (queryDoc, variables, options?: Options) => {
	const query = gql.iterate({
		query: queryDoc.toString(),
		variables: variables ?? {}
	})
	if (options?.callback) {
		for await (const { data } of query) {
			if (data) options.callback(data)
		}
	} else {
		return query.next().then(({ value }) => value.data)
	}
}

type Result<T> = T extends Promise<ExecutionResult<infer R, any>>
	? Promise<R>
	: never

type NewSdk = {
	[key in keyof Sdk]: (
		...args: Parameters<Sdk[key]>
	) => Result<ReturnType<Sdk[key]>>
}

export const Api = getSdk(query) as NewSdk
