import {
	assoc,
	compose,
	concat,
	head,
	juxt,
	o,
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

export const capitalize: (str: string) => string = o(
	juxt([compose(toUpper, head), tail]),
	concat
)
