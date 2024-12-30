import { T, assoc, map } from 'ramda'
import {
	isArray,
	isFunction,
	isNotUndefined,
	isPlainObj,
	isUndefined
} from 'ramda-adjunct'
import { caseOf, match } from './match'

// Utility types
type RequiredKeys<T> = {
	[K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

type OptionalKeys<T> = {
	[K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

// EvolveResult type
type EvolveResult<O, SPEC> = Omit<O, keyof SPEC> & {
	[K in keyof SPEC]: K extends keyof O
		? K extends RequiredKeys<O>
			? SPEC[K] extends (value: O[K]) => infer R
				? R
				: never
			: K extends OptionalKeys<O>
				? SPEC[K] extends (object: O) => infer R
					? R
					: never
				: never
		: SPEC[K] extends (object: O) => infer R
			? R
			: never
}

// Function type: (transformations, object)
export function evolveAlt<
	O extends object,
	T extends {
		[K in keyof T]: K extends keyof O
			? K extends RequiredKeys<O>
				? (value: O[K]) => any
				: K extends OptionalKeys<O>
					? (object: O) => any
					: never
			: (object: O) => any
	}
>(transformations: T, object: O): EvolveResult<O, T>

// Function type: (transformations) => (object)
export function evolveAlt<
	O,
	T extends {
		[K in keyof T | keyof O]: any
	}
>(transformations: T): <O2 extends O>(object: O2) => EvolveResult<O2, T>

// Function implementation
export function evolveAlt(specs: any, source?: any): any {
	if (source === undefined) {
		return (obj: any) => evolveAlt(specs, obj)
	} else {
		const fork = match<[any, any], any>(
			caseOf([isArray, isPlainObj], (prop, spec) => map(evolveAlt(spec), prop)),
			caseOf([isPlainObj, isPlainObj], (obj, spec) => evolveAlt(spec, obj)),
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
