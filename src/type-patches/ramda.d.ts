declare module 'ramda' {
	export function prop<O extends object, K extends keyof O>(
		prop: K
	): <U extends O, K2 extends K>(obj: U) => U[K2]
	type Primitive = string | number | boolean | null | undefined

	type DeepPartial<T> = T extends Primitive
		? T
		: T extends Array<infer U>
			? Array<DeepPartial<U>>
			: T extends ReadonlyArray<infer U>
				? ReadonlyArray<DeepPartial<U>>
				: T extends Map<infer K, infer V>
					? Map<DeepPartial<K>, DeepPartial<V>>
					: T extends ReadonlyMap<infer K, infer V>
						? ReadonlyMap<DeepPartial<K>, DeepPartial<V>>
						: T extends Set<infer U>
							? Set<DeepPartial<U>>
							: T extends ReadonlySet<infer U>
								? ReadonlySet<DeepPartial<U>>
								: { [K in keyof T]?: DeepPartial<T[K]> }

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
}

import 'ramda'
