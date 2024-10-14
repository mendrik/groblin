import type { Fn } from '@/type-patches/functions'
import {
	type Pred,
	aperture,
	append,
	converge,
	defaultTo,
	find,
	head,
	identity,
	last,
	nth,
	pipe,
	prepend
} from 'ramda'

export const appendFirst: <T>(l: T[]) => T[] = converge(append, [
	head,
	identity
])
export const prependLast: <T>(l: T[]) => T[] = converge(prepend, [
	last,
	identity
])

export const findNextElement = <T>(
	predicate: Pred<[T]>
): Fn<T[], T | undefined> =>
	pipe(
		appendFirst,
		aperture(2),
		find<[T, T]>(([curr]) => predicate(curr)),
		defaultTo([]),
		nth(1)
	)

export const findPrevElement = <T>(
	predicate: Pred<[T]>
): Fn<T[], T | undefined> =>
	pipe(
		prependLast,
		aperture(2),
		find<[T, T]>(([_, next]) => predicate(next)),
		defaultTo([]),
		nth(0)
	)

type Last<Type extends any[]> = Type extends [...any[], infer R] ? R : never

export const pipeTap =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T): ReturnType<Last<FUNCTIONS>> =>
		fns.reduce((_, fn) => fn(arg), undefined) as ReturnType<Last<FUNCTIONS>>
