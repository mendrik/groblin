import type { AnyFn } from '@tp/functions'
import { path, map } from 'ramda'

type Prev = [never, 0, 1, 2, 3, 4, ...0[]]

// Ensure only string keys are used in paths
type StringKeys<T> = Extract<keyof T, string>

type Paths<T, D extends number = 5> = [D] extends [never]
	? never
	: T extends object
		? {
				[K in StringKeys<T>]-?:
					| readonly [K]
					| (Paths<T[K], Prev[D]> extends infer P
							? P extends readonly any[]
								? readonly [K, ...P]
								: never
							: never)
			}[StringKeys<T>]
		: []

/**
 * Given an object type T, make sure the string[] array contains valid nested keys.
 */
export type TypesafePath<T> = Paths<T>

type TypeAtPath<T, P extends readonly string[]> = P extends readonly [
	infer First,
	...infer Rest
]
	? First extends keyof T
		? Rest extends readonly string[]
			? TypeAtPath<T[First], Rest>
			: T[First]
		: never
	: T

const impl: AnyFn = p => map(path(p))

export const pluckPath: <T, P extends TypesafePath<T>>(
	path: P,
	list: T[]
) => TypeAtPath<T, P>[] = impl

// Example usage
type Example = {
	a: {
		b: {
			c: number
			d: string
		}
	}
}

const path2 = ['a', 'b', 'd'] as const

const list: Example[] = [
	{ a: { b: { c: 1, d: 'a' } } },
	{ a: { b: { c: 2, d: '1' } } }
]

const result = pluckPath(path2, list) // Type is number[]

console.log(result) // [1, 2]
