import type { AnyFn } from '@tp/functions.ts'
import {
	apply,
	assoc,
	compose,
	concat,
	head,
	juxt,
	pipe,
	range,
	tail,
	tap,
	toUpper,
	zipWith
} from 'ramda'

export const debug = tap(console.log)

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

type INF<G extends Array<(e: any) => e is any>> = {
	[K in keyof G]: G[K] extends (e: any) => e is infer T ? T[] : never
}

export const fork =
	<T, ST extends T, G extends Array<(e: T) => e is ST>>(...preds: G) =>
	(v: T[]): [...INF<G>] =>
		preds.map(pred => v.filter(pred)) as [...INF<G>]
