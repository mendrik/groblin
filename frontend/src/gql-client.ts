import { type ExecutionResult, createClient } from 'graphql-ws'
import { head, pipe, toPairs } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import { type Sdk, getSdk } from './gql/graphql'
import { getItem } from './lib/local-storage'

const gql = createClient({
	url: 'ws://localhost:6173/graphql',
	connectionParams: () => ({
		authToken: getItem('token')
	})
})

type FirstProperty<T> = T extends { [K in keyof T]: infer U } ? U : never

type ApiSdk = {
	[K in keyof Sdk as ReturnType<Sdk[K]> extends Promise<any> ? K : never]: (
		...args: Parameters<Sdk[K]>
	) => ReturnType<Sdk[K]> extends Promise<ExecutionResult<infer R, any>>
		? Promise<FirstProperty<R>>
		: never
}

const firstProperty = pipe(toPairs, head, ([, value]) => value)

// Subscription SDK with proxy for subscription methods
export const Api = new Proxy<any>(
	getSdk((queryDoc, variables) => {
		const query = gql.iterate({
			query: queryDoc,
			variables: variables ?? {}
		})
		return query.next().then(({ value }) => value.data)
	}),
	{
		get:
			(target, key) =>
			async (...args: any[]) => {
				const res = await target[key](...args)
				return isNotNilOrEmpty(res) ? firstProperty(res) : undefined
			}
	}
) as ApiSdk

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

// Subscription SDK with proxy for subscription methods
export const Subscribe = new Proxy<any>(
	getSdk((queryDoc, variables) => {
		return gql.iterate({
			query: queryDoc,
			variables: variables ?? {}
		}) as AsyncIterable<ExecutionResult<any, any>>
	}),
	{
		get: (target, key) => async (vars: any, callback: Function) => {
			const asyncIter: AsyncIterable<any> = target[key](vars)
			for await (const { data } of asyncIter) {
				callback(data)
			}
		}
	}
) as SubscribeSdk
