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
	[K in keyof Sdk as ReturnType<Sdk[K]> extends Promise<any> ? K : never]: (
		...args: Parameters<Sdk[K]>
	) => Result<ReturnType<Sdk[K]>>
}

type SubResult<K extends keyof Sdk> = ReturnType<Sdk[K]> extends AsyncIterable<
	ExecutionResult<infer R, any>
>
	? R
	: never

type SubscribeSdk = {
	[K in keyof Sdk as ReturnType<Sdk[K]> extends AsyncIterable<any>
		? K
		: never]: (
		vars: Parameters<Sdk[K]>[0],
		callback: (data: SubResult<K>) => any
	) => SubResult<K>
}

export const Api = getSdk(query) as unknown as NewSdk

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
			return async (vars: any, callback: Function) => {
				const asyncIter: AsyncIterable<any> = target[key](vars)
				for await (const { data } of asyncIter) {
					callback(data)
				}
			}
		}
	}
) as SubscribeSdk
