import { equals, keys, pickBy, tap } from 'ramda'

type Last<Type extends any[]> = Type extends [...any[], infer R] ? R : never

type LastReturnType<Type extends any[]> = Type extends [...any[], infer LAST_FN]
	? LAST_FN extends () => Promise<infer R>
		? Promise<R>
		: LAST_FN extends () => infer R
			? Promise<R>
			: never
	: never

export const pipeTap =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T): ReturnType<Last<FUNCTIONS>> =>
		fns.reduce((_, fn) => fn(arg), undefined) as ReturnType<Last<FUNCTIONS>>

export const pipeTapAsync =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T) =>
		fns.reduce(
			(pc, fn) => pc.then(() => fn(arg)),
			Promise.resolve()
		) as LastReturnType<FUNCTIONS>

export const debug = tap(console.log)

export const idS = (s: string): string => s
export const idN = (s: number): number => s

/**
 * Finds the first key in a record that matches the given value.
 *
 * @template V - The type of the value to find.
 * @template K - The type of the keys in the record.
 * @param {V} value - The value to search for in the record.
 * @param {Record<K, V>} record - The record to search within.
 * @returns {K} - The first key that matches the given value.
 */
export const findKeysByValue =
	<V, K extends string>(value: V) =>
	(record: Record<K, V>): K[] => {
		const matchingKeyObj: Record<K, V> = pickBy(equals(value))(record)
		return keys(matchingKeyObj)
	}
