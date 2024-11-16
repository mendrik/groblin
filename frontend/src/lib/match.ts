import { isPrimitive } from 'ramda-adjunct'

// 1. Define a generic Guard type
type Guard<T> = (value: any) => value is T

// 2. Define a non-generic GuardOrPredicate type
type Matcher<T = any> =
	| ((value: any) => boolean)
	| Guard<any>
	| PrimitiveMatcher
	| ObjectMatcher<T>

// 3. Utility type to infer the type from a predicate
type InferPredicate<P, A> = P extends Guard<infer T> ? T : A

// 4. Define PrimitiveMatcher for matching primitives
type PrimitiveMatcher = string | number | boolean | null | undefined

// 5. Define ObjectMatcher for matching partial objects
type ObjectMatcher<T = any> = T extends object
	? { [P in keyof T]?: T[P] }
	: never

// 7. Define HandlerArgs as a tuple mapping Preds to Args
type HandlerArgs<
	Preds extends readonly Matcher[],
	Args extends readonly unknown[]
> = {
	[K in keyof Preds]: K extends keyof Args
		? InferPredicate<Preds[K], Args[K]>
		: never
}

// 8. Define MatchCase as a tuple of Preds and handler
type MatchCase<
	Preds extends readonly Matcher[],
	Args extends readonly unknown[],
	R
> = [Preds, (...args: HandlerArgs<Preds, Args>) => R]

// 9. Function to create a MatchCase with inferred types
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

// 10. Function to handle the matching logic
function matchValue<T>(value: T, matcher: Matcher<T>): boolean {
	if (typeof matcher === 'function') {
		return matcher(value)
	}
	if (isPrimitive(matcher)) {
		return value === matcher
	}
	if (isObject(matcher) && isObject(value)) {
		return Object.entries(matcher).every(([key, val]) => value[key] === val)
	}
	return false
}

// Utility to check if the value is an object
function isObject(value: any): value is Record<string, any> {
	return typeof value === 'object' && value !== null
}

// 11. Function to create a matcher with multiple MatchCases
export function match<Args extends readonly unknown[], R>(
	...cases: MatchCase<readonly Matcher<Args[number]>[], Args, R>[]
) {
	return (...values: Args): R => {
		for (const [predicates, handler] of cases) {
			if (predicates.length !== values.length) continue
			const allMatch = predicates.every((pred, index) =>
				matchValue(values[index], pred as any)
			)
			if (allMatch) {
				return handler(...(values as HandlerArgs<typeof predicates, Args>))
			}
		}
		throw new Error('No match found')
	}
}
