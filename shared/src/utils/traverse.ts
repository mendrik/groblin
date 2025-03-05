import { T as _, mapObjIndexed } from 'ramda'
import { isArray, isPlainObj } from 'ramda-adjunct'
import { caseOf, match } from './match'

type Values<O> = O extends Record<string, any>
	? {
			[K in keyof O]: O[K] extends (infer U)[]
				? U extends Record<string, any>
					? Values<U> // If it's an array of objects, recurse into the object type
					: U[] // If it's an array of primitives, add the primitive array type
				: O[K] extends Record<string, any>
					? Values<O[K]> // If it's a nested object, recurse
					: O[K] // Otherwise, add the primitive type
		}[keyof O]
	: never

export function traverse<
	O extends Record<string, any>,
	R extends Record<keyof O, any>
>(fn: (el: Values<O>, key?: string) => Values<R>): (obj: O) => R
export function traverse<
	O extends Record<string, any>,
	R extends Record<keyof O, any>
>(fn: (el: Values<O>, key?: string) => Values<R>, obj: O): R

export function traverse(
	fn: (value: any, key?: string) => any,
	obj?: any
): any {
	if (obj === undefined) {
		return (obj: object) => traverse(fn as any, obj)
	} else {
		return mapObjIndexed(
			match<[any, string], any>(
				caseOf([isArray, _], (v, k) => v.map(e => traverse(fn, e))),
				caseOf([isPlainObj, _], (v, k) => traverse(fn, v)),
				caseOf([_, _], console.log)
			),
			obj
		)
	}
}
