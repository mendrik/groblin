import { assoc, range, tap, zipWith } from 'ramda'

export const debug = tap(console.log)

export const addOrder =
	<T, P extends string>(prop: P) =>
	<T2 extends T & { [key in P]: number }>(t: T[]): T2[] =>
		zipWith(assoc(prop), range(0, t.length), t) as T2[]
