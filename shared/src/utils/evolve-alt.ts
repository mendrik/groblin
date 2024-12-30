import { T, assoc, map } from 'ramda'
import {
	isArray,
	isFunction,
	isNotUndefined,
	isPlainObj,
	isUndefined
} from 'ramda-adjunct'
import { caseOf, match } from './match'

/**
 * A function that takes either the property value or the entire source object
 * (depending on whether the property exists in the source) and returns some
 * transformed output.
 */
type TransformFn<Prop, Source> =
	| ((prop: Prop) => any)
	| ((source: Source) => any)

/**
 * The heart of the "spec" type. For each key in T, you can either:
 *  - supply another nested Spec to recurse on the property,
 *  - supply a function that transforms the property itself,
 *  - or supply a function that transforms the entire object (if that key
 *    isn't in the original object or you just want full-object context).
 *
 * We also allow arbitrary string keys (beyond `keyof T`) for "on-the-fly"
 * properties that do not exist in T. Those transformation functions receive
 * the entire `T`.
 */
export type Spec<T extends object> = {
	[K in keyof T]?: // If T[K] is an array, the spec can be either an object describing how to evolve
	// each item, or a function that transforms the array itself, or a function
	// that transforms the entire T.
	T[K] extends Array<infer Item>
		? Item extends object
			? Spec<Item> | TransformFn<T[K], T>
			: T[K] extends object
				? Spec<T[K]> | TransformFn<T[K], T>
				: TransformFn<T[K], T>
		: TransformFn<T[K], T>
} & {
	// Arbitrary extra keys that do NOT exist in T must be a function that sees the entire T
	[ExtraKey: string]: unknown
}

/**
 * This type computes the *result* of applying a Spec<S> to an object S.
 *
 * - For existing keys in S, if the spec is:
 *    - A function taking S[K], we infer its return type.
 *    - A function taking S (the entire object), we infer its return type.
 *    - Another nested Spec for objects/arrays, we recursively build up the transformed type.
 *    - If no spec is given for a key, that key remains unchanged.
 * - For "extra" keys in the spec that are not in S, we call the function with S,
 *   and the resulting key’s type is whatever that function returns.
 */
export type EvolveResult<S extends object, Sp extends Spec<S>> = Omit<
	// matching spec entry: // Start with all original keys in S, but "upgrade" the type where there's a
	S,
	keyof Sp
> & {
	[K in keyof Sp]: // If this key also exists in S, we handle that property’s transformation:
	K extends keyof S
		? // Distinguish if Sp[K] is an object spec or a function
			Sp[K] extends (...args: any[]) => any
			? // It's a function. We need to see if it expects S[K] or the full S
				Sp[K] extends (prop: S[K]) => infer R1
				? R1
				: Sp[K] extends (obj: S) => infer R2
					? R2
					: never
			: // It's not a function but a nested spec
				S[K] extends Array<infer Item>
				? Item extends object
					? Sp[K] extends Spec<Item>
						? Array<EvolveResult<Item, Sp[K]>>
						: S[K]
					: S[K]
				: // Otherwise, if S[K] is an object, we recursively transform
					S[K] extends object
					? Sp[K] extends Spec<S[K]>
						? EvolveResult<S[K], Sp[K]>
						: S[K]
					: // S[K] is primitive but spec is object? (unlikely by this definition)
						S[K]
		: // If this key doesn't exist in S, then Sp[K] must be a function that sees the entire S
			Sp[K] extends (obj: S) => infer R3
			? R3
			: never
}

export function evolveAlt<O extends object, Sp extends Spec<O>>(
	specs: Sp,
	source: O
): EvolveResult<O, Sp>

export function evolveAlt<O extends object, Sp extends Spec<O>>(
	specs: Sp
): <R extends EvolveResult<O, Sp>>(source: O) => R

export function evolveAlt(specs: any, source?: any): any {
	if (source === undefined) {
		return (obj: any) => evolveAlt(specs, obj)
	} else {
		const fork = match<[any, any], any>(
			caseOf([isArray, isPlainObj], (prop, spec) =>
				map(evolveAlt(spec as any), prop)
			),
			caseOf([isPlainObj, isPlainObj], (obj, spec) =>
				evolveAlt(spec as any, obj)
			),
			caseOf([isNotUndefined, isFunction], (prop, fn) => fn(prop)),
			caseOf([isUndefined, isFunction], (_, fn) => fn(source)),
			caseOf([T, T], (prop, _) => prop)
		)
		return Object.entries(specs).reduce(
			(acc: any, [key, spec]: [string, any]) =>
				assoc(key, fork(acc[key], spec), acc),
			source ?? {}
		)
	}
}
