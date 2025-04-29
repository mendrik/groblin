import type { ExecutionResult } from 'graphql'
import type { Container } from 'inversify'
import type { Pool } from 'pg'
import type { Sdk } from './test-sdk.ts'

type DeepNonNullable<T> = T extends null | undefined
	? never
	: T extends (...args: infer A) => infer R
		? (...args: DeepNonNullable<A>) => DeepNonNullable<R>
		: T extends any[]
			? DeepNonNullableArray<T[number]>
			: T extends object
				? DeepNonNullableObject<T>
				: T

interface DeepNonNullableArray<T> extends Array<DeepNonNullable<T>> {}

type DeepNonNullableObject<T> = {
	[P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>>
}

type IsUnion<T, U = T> = T extends any // distribute over each member of the (possible) union
	? [U] extends [T] // will be true only when the candidate has **one** member
		? false
		: true
	: never

type FirstProp<T> = IsUnion<keyof T> extends true ? never : T[keyof T]

export type CustomSdk = {
	[K in keyof Sdk]: Sdk[K] extends (...args: infer A)
	 => Promise<ExecutionResult<infer P, any>>
		? (...args: A) => DeepNonNullable<FirstProp<P>>
		: never
}

declare module 'vitest' {
	export interface TestContext {
		pool: Pool
		container: Container
		sdk: CustomSdk
	}
}

export default async function globalSetup() {}
