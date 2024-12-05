import { isPrimitive } from 'ramda-adjunct'

type Guard<T> = (value: any) => value is T

type Matcher<T = any> =
	| ((value: any) => boolean)
	| Guard<any>
	| PrimitiveMatcher
	| ObjectMatcher<T>

type InferPredicate<P, A> = P extends Guard<infer T> ? T : A

type PrimitiveMatcher = string | number | boolean | null | undefined

type ObjectMatcher<T = any> = T extends object
	? { [P in keyof T]?: T[P] }
	: never

type HandlerArgs<
	Preds extends readonly Matcher[],
	Args extends readonly unknown[]
> = {
	[K in keyof Preds]: K extends keyof Args
		? InferPredicate<Preds[K], Args[K]>
		: never
}

type MatchCase<
	Preds extends readonly Matcher[],
	Args extends readonly unknown[],
	R
> = [Preds, (...args: HandlerArgs<Preds, Args>) => R]

export function caseOf<
	Preds extends [Matcher, ...Matcher[]],
	Args extends readonly unknown[],
	R
>(
	predicates: Preds,
	handler: (...args: HandlerArgs<Preds, Args>) => R
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
	if (isObject(matcher) && isObject(value)) {
		return Object.entries(matcher).every(([key, val]) =>
			matchValue(value[key], val as Matcher<T>)
		)
	}
	return false
}

const isObject = (value: any): value is Record<string, any> =>
	typeof value === 'object' && value !== null

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
				return handler(...(values as HandlerArgs<typeof predicates, Args>))
			}
		}
		throw new Error('No match found')
	}
}
