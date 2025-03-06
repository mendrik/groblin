import type { AnyFn } from '@tp/functions.ts'
import {
	apply,
	assoc,
	compose,
	concat,
	head,
	identity,
	juxt,
	pipe,
	range,
	splitAt,
	tail,
	tap,
	toUpper,
	useWith,
	zipWith
} from 'ramda'

export const debug = tap(console.log)
export const debugFn =
	<F extends AnyFn>(fn: F) =>
	async (...args: Parameters<F>) => {
		console.log('Calling', fn.name, 'with', args)
		const result = await fn.apply(null, args)
		console.log('Result', result)
		return result
	}

export const addOrder =
	<T, P extends string>(prop: P) =>
	<T2 extends T & { [key in P]: number }>(t: T[]): T2[] =>
		zipWith(assoc(prop), range(0, t.length), t) as T2[]

export const capitalize: (s: string) => string = pipe(
	juxt([compose(toUpper, head), tail]) as AnyFn,
	apply(concat)
) as AnyFn

export const entriesWithIndex = <T extends object>(
	obj: T
): [keyof T, T, number][] =>
	Object.entries(obj).map(([key, value], index) => [
		key as keyof T,
		value,
		index
	])

type Guard<T, ST extends T> = (e: T) => e is ST
type Pred<T> = (e: T) => boolean
type GP<T, ST extends T> = Guard<T, ST> | Pred<T>

type INF<G> = {
	[K in keyof G]: G[K] extends Guard<infer T, infer ST>
		? ST[]
		: G[K] extends (a: infer A) => boolean
			? A[]
			: never
}

export const fork =
	<T, G extends Array<GP<any, any>>>(...preds: G) =>
	<T2 extends T>(v: T2[]): [...INF<G>] =>
		preds.map(pred => v.filter(pred)) as [...INF<G>]

export const removeAt = (idx: number): (<T>(list: T[]) => T[]) =>
	pipe(splitAt(idx) as AnyFn, apply(useWith(concat, [identity, tail]) as AnyFn))

