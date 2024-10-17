// 1. Define a generic Guard type
type Guard<T> = (value: any) => value is T

// 2. Define a non-generic GuardOrPredicate type
type GuardOrPredicate = ((value: any) => boolean) | Guard<any>

// 3. Utility type to infer the type from a predicate
type InferPredicate<P, A> = P extends Guard<infer T> ? T : A

// 4. Define HandlerArgs as a tuple mapping Preds to Args
type HandlerArgs<
	Preds extends readonly GuardOrPredicate[],
	Args extends readonly unknown[]
> = {
	[K in keyof Preds]: K extends keyof Args
		? InferPredicate<Preds[K], Args[K]>
		: never
}

// 5. Define MatchCase as a tuple of Preds and handler
type MatchCase<
	Preds extends readonly GuardOrPredicate[],
	Args extends readonly unknown[],
	R
> = [Preds, (...args: HandlerArgs<Preds, Args>) => R]

// 6. Function to create a MatchCase with inferred types
export function caseOf<
	Preds extends [GuardOrPredicate, ...GuardOrPredicate[]],
	Args extends readonly unknown[],
	R
>(
	predicates: Preds,
	handler: (...args: HandlerArgs<Preds, Args>) => R
): MatchCase<Preds, Args, R> {
	return [predicates, handler]
}

// 7. Function to create a matcher with multiple MatchCases
export function match<Args extends readonly unknown[], R>(
	...cases: MatchCase<readonly GuardOrPredicate[], Args, R>[]
) {
	return (...values: Args): R | undefined => {
		for (const [predicates, handler] of cases) {
			if (predicates.length !== values.length) continue

			const allMatch = predicates.every((pred, index) => pred(values[index]))
			if (allMatch) {
				return handler(...(values as HandlerArgs<typeof predicates, Args>))
			}
		}
		return undefined
	}
}
