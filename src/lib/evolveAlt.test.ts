// Import the necessary functions from Vitest
import { describe, expect, it } from 'vitest'
import { evolveAlt } from './evolveAlt' // Adjust the import path accordingly

describe('evolveAlt', () => {
	it('should transform existing properties correctly', () => {
		const obj = { a: 2, b: 3 }
		const transformations = {
			a: (x: number) => x * 2,
			b: (x: number) => x + 1
		}
		const result = evolveAlt(transformations, obj)
		result.a // $ExpectType number
		result.b // $ExpectType number
		expect(result).toEqual({ a: 4, b: 4 })
	})

	it('should add new properties using the entire object', () => {
		const obj = { x: 1, y: 2 }
		const transformations = {
			z: (o: typeof obj) => o.x + o.y
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ x: 1, y: 2, z: 3 })
	})

	it('should handle mixed transformations of existing and new properties', () => {
		const obj = { m: 5, n: 10 }
		const transformations = {
			m: (x: number) => x - 1,
			o: (o: typeof obj) => o.m * o.n
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ m: 4, n: 10, o: 50 })
	})

	it('should work with different data types', () => {
		const obj = { num: 5, str: 'hello', arr: [1, 2], bool: true }
		const transformations = {
			num: (n: number) => n * n,
			str: (s: string) => s.toUpperCase(),
			arr: (a: number[]) => a.concat(3),
			bool: (b: boolean) => !b
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({
			num: 25,
			str: 'HELLO',
			arr: [1, 2, 3],
			bool: false
		})
	})

	it('should handle nested objects', () => {
		const obj = { nested: { value: 2 } }
		const transformations = {
			nested: (n: { value: number }) => ({ value: n.value * 3 })
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ nested: { value: 6 } })
	})

	it('should handle empty objects and transformations', () => {
		const obj = {}
		const transformations = {}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({})
	})

	it('should not modify properties not specified in transformations', () => {
		const obj = { a: 1, b: 2, c: 3 }
		const transformations = {
			a: (x: number) => x + 10
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ a: 11, b: 2, c: 3 })
	})

	it('should handle functions that return different types', () => {
		const obj = { a: 1, b: 'text' }
		const transformations = {
			a: (x: number) => x.toString(),
			b: (s: string) => s.length
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ a: '1', b: 4 })
	})

	it('should overwrite existing properties if the key matches', () => {
		const obj = { a: 5 }
		const transformations = {
			a: (x: number) => x * 10
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ a: 50 })
	})

	it('should infer correct types', () => {
		const obj = { num: 10, str: 'hello' }
		const transformations = {
			num: (n: number) => n.toString(),
			str: (s: string) => s.length,
			newProp: (o: typeof obj) => o.str + o.num
		}
		const result = evolveAlt(transformations, obj)

		// TypeScript should infer the result type as:
		// {
		//   num: string;
		//   str: number;
		//   newProp: string;
		// }

		type ExpectedType = {
			num: string
			str: number
			newProp: string
		}
		type ActualType = typeof result

		// Ensure the types match
		const typeTest: ExpectedType = result
		expect(result).toEqual({ num: '10', str: 5, newProp: 'hello10' })
	})

	it('should handle transformations that use the whole object', () => {
		const obj = { a: 1, b: 2 }
		const transformations = {
			sum: (o: typeof obj) => o.a + o.b
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ a: 1, b: 2, sum: 3 })
	})

	it('should work when transformations return undefined', () => {
		const obj = { a: 1 }
		const transformations = {
			a: () => undefined,
			b: () => undefined
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ a: undefined, b: undefined })
	})

	it('should handle arrays as properties', () => {
		const obj = { arr: [1, 2, 3] }
		const transformations = {
			arr: (a: number[]) => a.map(x => x * 2)
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ arr: [2, 4, 6] })
	})

	it('should handle complex nested transformations', () => {
		const obj = { a: { b: { c: 1 } } }
		const transformations = {
			a: (a: { b: { c: number } }) => ({ b: { c: a.b.c + 1 } })
		}
		const result = evolveAlt(transformations, obj)
		expect(result).toEqual({ a: { b: { c: 2 } } })
	})
})
