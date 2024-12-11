import { throwAny } from '@shared/errors'
import { type ExecutionResult, createClient } from 'graphql-ws'
import { T, has, head, pipe, pluck, prop, toPairs, when } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import { type Sdk, getSdk } from './gql/graphql'
import { getItem } from './lib/local-storage'

const gql = createClient({
	url: 'ws://localhost:6173/graphql',
	connectionParams: () => ({
		authToken: getItem('token')
	}),
	keepAlive: 300,
	shouldRetry: T,
	retryAttempts: Number.POSITIVE_INFINITY,
	on: {
		opened: () => {
			console.log('WebSocket connection established')
		},
		closed: e => {
			console.log('WebSocket connection closed', e)
		},
		error: err => {
			console.error('WebSocket error:', err)
		}
	}
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

const throwErrors = when(
	has('errors'),
	pipe(prop('errors'), pluck('message'), throwAny)
) as <T>(a: T) => T
// Subscription SDK with proxy for subscription methods
export const Api = new Proxy<any>(
	getSdk((queryDoc, variables) =>
		gql
			.iterate({ query: queryDoc, variables: variables ?? {} })
			.next()
			.then(prop('value'))
			.then(throwErrors)
			.then(prop('data'))
	),
	{
		get:
			(target, key) =>
			(...args: any[]) =>
				target[key](...args).then(when(isNotNilOrEmpty, firstProperty))
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
	) => AbortController
}

// Subscription SDK with proxy for subscription methods
export const Subscribe = new Proxy<any>(
	getSdk(
		(queryDoc, variables) =>
			gql.iterate({
				query: queryDoc,
				variables: variables ?? {}
			}) as AsyncIterable<ExecutionResult<any, any>>
	),
	{
		get: (target, key: string) => (vars: any, callback: Function) => {
			const controller = new AbortController()
			const subscribe = async (
				asyncIter: AsyncIterable<any>,
				signal: AbortSignal
			) => {
				for await (const { data } of asyncIter) {
					if (signal.aborted) {
						break
					}
					callback(data)
				}
			}
			void subscribe(target[key](vars), controller.signal)
			return controller
		}
	}
) as SubscribeSdk
