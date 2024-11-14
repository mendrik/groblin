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

export const GQL = new Proxy(getSdk(query), {
	get: (target, property: keyof Sdk) => {
		const original = target[property]
		if (original && 'apply' in original) {
			return async (...args: Parameters<typeof original>) => {
				const res = await (original as Function).apply(target, args)
				return res.data
			}
		}
		return original
	}
}) as NewSdk

export const subscribe: Requester<
	{ callback: (data: any) => void },
	object
> = async (subscriptionDoc, variables, options): unknown => {
	const subs = gql.iterate({
		query: subscriptionDoc.toString(),
		variables: variables ?? {}
	})
	for await (const { data } of subs) {
		if (data) options?.callback(data)
	}
}
