import type { AnyFn } from '@tp/functions.ts'
export declare const debug: any
export declare const debugFn: <F extends AnyFn>(
	fn: F
) => (...args: Parameters<F>) => Promise<any>
export declare const addOrder: <T, P extends string>(
	prop: P
) => <T2 extends T & { [key in P]: number }>(t: T[]) => T2[]
export declare const capitalize: (s: string) => string
export declare const entriesWithIndex: <T extends object>(
	obj: T
) => [string, T, number][]
type Guard<T, ST extends T> = (e: T) => e is ST
type Pred<T> = (e: T) => boolean
type GP<T, ST extends T> = Guard<T, ST> | Pred<T>
type INF<G> = {
	[K in keyof G]: G[K] extends Guard<infer _T, infer ST>
		? ST[]
		: G[K] extends (a: infer A) => boolean
			? A[]
			: never
}
/**
 * Takes a list of predicates and returns a function that takes a list of values and returns a list of lists of values
 * where each list of values is the result of filtering the input list by the corresponding predicate.
 * This function does not partition the input list: elements can be in multiple output lists.
 * @param preds
 * @returns
 */
export declare const fork: <T, G extends Array<GP<any, any>>>(
	...preds: G
) => <T2 extends T>(v: T2[]) => [...INF<G>]
export declare const removeAt: (idx: number) => <T>(list: T[]) => T[]
