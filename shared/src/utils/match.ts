import type { AnyFn } from '@tp/functions'
import { isArray, isFunction, isPrimitive } from 'ramda-adjunct'

type Guard<T> = (value: any) => value is T
type Predicate = (value: any) => boolean

type Matcher<T = any> =
	| Predicate
	| Guard<any>
	| PrimitiveMatcher
	| ObjectMatcher<T>
	| TupleMatcher<T>

type NarrowedArg<P, A> = P extends Guard<infer T>
	? T
	: P extends [infer P1, infer P2]
		? A extends [infer A1, infer A2]
			? [NarrowedArg<P1, A1>, NarrowedArg<P2, A2>]
			: never
		: P extends AnyFn
			? A
			: P extends object
				? {
						[K in keyof P]: K extends keyof A ? NarrowedArg<P[K], A[K]> : never
					}
				: A

type PrimitiveMatcher = string | number | boolean | null | undefined

type ObjectMatcher<T = any> = T extends object
	? { [P in keyof T]?: T[P] | Matcher<T[P]> }
	: never

type TupleMatcher<T = any> = T extends [infer A, infer B]
	? [A | Matcher<A>, B | Matcher<B>]
	: never

type HandlerArgs<
	Preds extends readonly Matcher[],
	Args extends readonly unknown[]
> = {
	[K in keyof Preds]: K extends keyof Args
		? NarrowedArg<Preds[K], Args[K]>
		: never
}

type MatchCase<
	Preds extends readonly Matcher[],
	Args extends readonly unknown[],
	R
> = [Preds, ((...args: HandlerArgs<Preds, Args>) => R) | R]

export function caseOf<
	Preds extends [Matcher, ...Matcher[]],
	Args extends readonly unknown[],
	R
>(
	predicates: Preds,
	handler: ((...args: HandlerArgs<Preds, Args>) => R) | R
): MatchCase<Preds, Args, R> {
	return [predicates, handler]
}

const matchValue = <T>(value: T, matcher: Matcher<T>): boolean => {
	if (typeof matcher === 'function') {
		return matcher(value)
	}
	if (isPrimitive(matcher)) {
		return value === matcher
	}
	if (isTuple(matcher) && isTuple(value)) {
		matcher[0]
		return (
			matchValue(value[0], matcher[0] as Matcher<T>) &&
			matchValue(value[1], matcher[1] as Matcher<T>)
		)
	}
	if (isObject(matcher) && isObject(value)) {
		return Object.entries(matcher).every(([key, val]) =>
			matchValue(value[key], val as Matcher<T>)
		)
	}
	return false
}

const isObject = (value: any): value is Record<string, any> =>
	typeof value === 'object' && value !== null

const isTuple = (value: any): value is [any, any] =>
	isArray(value) && value.length === 2

export function match<Args extends readonly unknown[], R>(
	...cases: MatchCase<readonly Matcher<Args[number]>[], Args, R>[]
) {
	return (...values: Args): R => {
		for (const [predicates, handler] of cases) {
			if (predicates.length !== values.length) continue
			const allMatch = predicates.every((pred, index) =>
				matchValue(values[index], pred as Matcher<unknown>)
			)
			if (allMatch) {
				return isFunction(handler)
					? handler(...(values as HandlerArgs<typeof predicates, Args>))
					: handler
			}
		}
		throw new Error('No match found')
	}
}
