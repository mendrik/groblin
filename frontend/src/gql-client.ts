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

const query: Requester = async (queryDoc, variables) => {
	const query = gql.iterate({
		query: queryDoc,
		variables: variables ?? {}
	})
	return query.next().then(({ value }) => value.data)
}

type Result<T> = T extends Promise<ExecutionResult<infer R, any>>
	? Promise<R>
	: never

type NewSdk = {
	[key in keyof Sdk]: (
		...args: Parameters<Sdk[key]>
	) => Result<ReturnType<Sdk[key]>>
}

type SubResult<T> = T extends AsyncIterable<ExecutionResult<infer R, any>>
	? R
	: never

type SubscribeSdk = {
	[key in keyof Sdk]: (
		...args: Parameters<Sdk[key]>
	) => <T>(callback: (data: SubResult<ReturnType<Sdk[key]>>) => T) => void
}

export const Api = getSdk(query) as NewSdk

// Subscription SDK with proxy for subscription methods
export const Subscribe = new Proxy<any>(
	getSdk((queryDoc, variables) => {
		return gql.iterate({
			query: queryDoc,
			variables: variables ?? {}
		}) as AsyncIterable<ExecutionResult<any, any>>
	}),
	{
		get: (target, key) => {
			return (...args: any[]) =>
				async <T>(callback: (data: any) => T) => {
					const asyncIter: AsyncIterable<any> = target[key](...args)
					for await (const { data } of asyncIter) {
						callback(data)
					}
				}
		}
	}
) as SubscribeSdk
