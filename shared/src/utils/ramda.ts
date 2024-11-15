import { assoc, range, tap, zipWith } from 'ramda'

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

export const addOrder =
	<T extends object>(prop: keyof T) =>
	(t: T[]): T[] =>
		zipWith(assoc(prop), range(0, t.length), t) as T[]
