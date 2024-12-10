import { describe, expect, it } from 'vitest'
import { pluckPath } from './pluck-path.ts'

describe('pluckPath', () => {
	it('should pluck the correct path from objects in the list', () => {
		const list = [
			{ a: { b: 1 }, c: 2 },
			{ a: { b: 3 }, c: 4 }
		]
		const result = pluckPath(['a', 'b'])(list)
		const result2 = pluckPath(['a', 'b2'])(list)
		expect(result).toEqual([1, 3])
	})

	it('should return an empty array if the path does not exist', () => {
		const list = [
			{ a: { b: 1 }, c: 2 },
			{ a: { b: 3 }, c: 4 }
		]
		const result = pluckPath(['x', 'y'])(list)
		expect(result).toEqual([undefined, undefined])
	})

	it('should handle empty list', () => {
		const list: Array<{ a: { b: number }; c: number }> = []
		const result = pluckPath(['a', 'b'])(list)
		expect(result).toEqual([])
	})
})
