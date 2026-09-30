import { firstProperty } from '@shared/helpers'
import { type DocumentNode, type GraphQLFormattedError, print } from 'graphql'
import { createClient, type ExecutionResult } from 'graphql-ws'
import { prop, T, when } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import { getSdk, type Sdk } from './gql/graphql'

const endpoint = new URL(
	import.meta.env.VITE_GRAPHQL_WS_URL ?? '/graphql',
	window.location.href
)
endpoint.protocol =
	endpoint.protocol === 'https:' || endpoint.protocol === 'wss:'
		? 'wss:'
		: 'ws:'
const gql = createClient({
	url: endpoint.href,
	keepAlive: 1000,
	shouldRetry: T,
	retryAttempts: 10
})

export const disconnect = () => gql.dispose()
let activeProjectId: number | undefined
export const setActiveProjectId = (id: number | undefined) => {
	activeProjectId = id
}
const projectExtension = () =>
	activeProjectId === undefined
		? {}
		: { extensions: { projectId: activeProjectId } }

type FirstProperty<T> = T extends { [K in keyof T]: infer U } ? U : never

type ApiSdk = {
	[K in keyof Sdk as ReturnType<Sdk[K]> extends Promise<any> ? K : never]: (
		...args: Parameters<Sdk[K]>
	) => ReturnType<Sdk[K]> extends Promise<ExecutionResult<infer R, any>>
		? Promise<FirstProperty<R>>
		: never
}

export class ApiError extends Error {
	readonly code: unknown
	constructor(errors: readonly GraphQLFormattedError[]) {
		super(errors.map(error => error.message).join('\n'))
		this.name = 'ApiError'
		this.code = errors[0]?.extensions?.code
	}
}

const throwErrors = <T extends { errors?: readonly GraphQLFormattedError[] }>(
	result: T
): T => {
	if (result.errors?.length) throw new ApiError(result.errors)
	return result
}
// Subscription SDK with proxy for subscription methods
export const Api = new Proxy<any>(
	getSdk(async <R, V>(queryDoc: DocumentNode, variables?: V) => {
		const iterator = gql.iterate<R>({
			...projectExtension(),
			query: print(queryDoc),
			variables: variables ?? {}
		})
		try {
			const result = await iterator.next()
			if (result.done) throw new Error('Query ended without a response')
			return { data: throwErrors(result.value).data }
		} finally {
			await iterator.return?.()
		}
	}),
	{
		get:
			(target, key) =>
			(...args: any[]) =>
				target[key](...args)
					.then(prop('data'))
					.then(when(isNotNilOrEmpty, firstProperty))
	}
) as ApiSdk

type SubResult<K extends keyof Sdk> =
	ReturnType<Sdk[K]> extends AsyncIterable<ExecutionResult<infer R, any>>
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
				...projectExtension(),
				query: print(queryDoc),
				variables: variables ?? {}
			}) as AsyncIterable<ExecutionResult<any, any>>
	),
	{
		get: (target, key: string) => (vars: any, callback: Function) => {
			const controller = new AbortController()
			const subscribe = async (
				asyncIter: AsyncIterable<ExecutionResult>,
				signal: AbortSignal
			) => {
				const iterator = asyncIter[Symbol.asyncIterator]()
				let closing: Promise<unknown> | undefined
				const close = () => (closing ??= Promise.resolve(iterator.return?.()))
				const report = (error: unknown) =>
					console.log('subscription failed', error)
				const abort = () => {
					void close().catch(report)
				}
				signal.addEventListener('abort', abort, { once: true })
				try {
					while (!signal.aborted) {
						const result = await iterator.next()
						if (signal.aborted || result.done) break
						callback(throwErrors(result.value).data)
					}
				} catch (error) {
					report(error)
				} finally {
					signal.removeEventListener('abort', abort)
					await close().catch(report)
				}
			}
			void subscribe(target[key](vars), controller.signal)
			return controller
		}
	}
) as SubscribeSdk
