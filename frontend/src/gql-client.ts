import { type ExecutionResult, createClient } from 'graphql-ws'
import { type Requester, type Sdk, getSdk } from './gql/graphql'
import { getItem } from './lib/local-storage'

const gql = createClient({
	url: 'ws://localhost:6173/graphql',
	connectionParams: () => ({
		authToken: getItem('token')
	})
})

const query: Requester = async (queryDoc, variables) => {
	const query = gql.iterate({
		query: queryDoc.toString(),
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

export const Api = new Proxy(getSdk(query), {
	get: (target, property: keyof NewSdk) => {
		const original = target[property]
		if (original && 'apply' in original) {
			return async (...args: Parameters<typeof original>) =>
				await (original as Function).apply(target, args)
		}
		return original
	}
}) as NewSdk

export const subscribe = async <V, E>(
	subscription: () => AsyncIterable<ExecutionResult<V, E>>,
	callback: (data: V) => void
) => {
	const iterator = await subscription()
	console.log(iterator)

	for await (const { data } of iterator) {
		console.log(data)

		if (data) callback(data as V)
	}
}
