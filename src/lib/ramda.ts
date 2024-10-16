import type { Fn } from '@/type-patches/functions'
import {
	type Pred,
	all,
	aperture,
	append,
	cond,
	converge,
	defaultTo,
	dropLast,
	equals,
	find,
	head,
	identity,
	juxt,
	last,
	map,
	nth,
	o,
	pipe,
	prepend,
	unapply,
	useWith
} from 'ramda'

export const appendFirst: <T>(l: T[]) => T[] = converge(append, [
	head,
	identity
])
export const prependLast: <T>(l: T[]) => T[] = converge(prepend, [
	last,
	identity
])

export const findNextElement = <T>(predicate: Pred<[T]>) =>
	pipe(
		appendFirst,
		aperture(2),
		find<[T, T]>(([curr]) => predicate(curr)),
		defaultTo([]),
		nth(1)
	) as Fn<T[], T | undefined>

export const findPrevElement = <T>(predicate: Pred<[T]>) =>
	pipe(
		prependLast,
		aperture(2),
		find<[T, T]>(([_, next]) => predicate(next)),
		defaultTo([]),
		nth(0)
	) as Fn<T[], T | undefined>

type Last<Type extends any[]> = Type extends [...any[], infer R] ? R : never

export const pipeTap =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T): ReturnType<Last<FUNCTIONS>> =>
		fns.reduce((_, fn) => fn(arg), undefined) as ReturnType<Last<FUNCTIONS>>

type LastReturnType<Type extends any[]> = Type extends [...any[], infer LAST_FN]
	? LAST_FN extends () => Promise<infer R>
		? Promise<R>
		: LAST_FN extends () => infer R
			? Promise<R>
			: never
	: never

export const asyncPipeTap =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T) =>
		fns.reduce(
			(pc, fn) => pc.then(() => fn(arg)),
			Promise.resolve()
		) as LastReturnType<FUNCTIONS>

const allTrue = all(equals(true))

type Predicates<ARGS extends any[]> = {
	[INDEX in keyof ARGS]: (a: ARGS[INDEX]) => boolean
}
type Pattern<A extends any[], R> = [...Predicates<A>, (...a: A) => R]

/**
 * Shortcut for cond() + matcher(). So instead of writing
 * cond<[string, number], string>([
 *   [matches(equals('a'), equals(1)), () => 'first'],
 *   [matches(equals('b'), equals(2)), () => 'second']
 * ])("a", 1) => "first"
 * you can write:
 * pattern<[string, number], string>([
 *   [equals('a'), equals(1), () => 'first'],
 *   [equals('b'), equals(2), () => 'second']
 * ])('b', 2) => "second"
 * Please note that unlike matcher(), pattern() always needs
 * a full set conditions that matches the arity of the calling
 * arguments in length.
 */
export const pattern: <A extends any[], R>(
	patterns: ReadonlyArray<Pattern<A, R>>
) => (...a: A) => R = o(
	cond,
	map<any, any>(
		juxt([
			pipe(dropLast(1), (useWith as any)(unapply(allTrue))), // as condition
			last
		])
	)
) as any
