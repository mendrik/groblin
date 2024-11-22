import 'ramda'
import type { DeepPartial } from './toolbelt'

declare module 'ramda' {
	export function prop<O extends object, K extends keyof O>(
		prop: K
	): <U extends O, K2 extends K>(obj: U) => U[K2]

	type EvolveFunction<T> = (val: T) => T

	type TransformationsObject<T> = {
		[K in keyof T]?: T[K] extends object
			? TransformationsObject<T[K]>
			: EvolveFunction<T[K]> | T[K]
	}

	export function evolve<T extends object>(
		transformations: TransformationsObject<DeepPartial<T>>,
		target: T
	): T

	export function evolve<T extends object>(
		transformations: TransformationsObject<DeepPartial<T>>
	): (target: T) => T

	export function pluck<R extends any[]>(prop: string): (list: any) => R

	export type Pred<T extends any[]> = (...v: T) => boolean

	export type ExcludeNever<T, U> = [U] extends [never]
		? NonNullable<T>
		: Exclude<T, U>

	export function unless<T, U extends T, V>(
		pred: (a: T) => a is U,
		whenFalseFn: (a: ExcludeNever<T, U>) => V
	): (a: T) => T | V

	export function unless<T, U extends T, V>(
		pred: (a: T) => a is U,
		whenFalseFn: (a: ExcludeNever<T, U>) => V,
		a: T
	): T | V

	export function prop<O extends object, K extends keyof O>(
		prop: K
	): <O2 extends O, K2 extends K>(obj: O2) => O2[K2]

	type OmitType<T, K extends keyof T> = Omit<T, K>

	export function omit<T extends { [s: string]: any }, K extends keyof T>(
		keys: K[]
	): <T2>(obj: T2) => T2 extends T ? OmitType<T2, K> : never

	export function move<T>(
		from: number,
		to: number
	): <T2 extends T>(list: readonly T2[]) => T2[]

	export function any<T>(
		fn: (a: T) => boolean
	): <T2 extends T>(list: readonly T2[]) => boolean
}
