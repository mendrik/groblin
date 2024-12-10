import { describe, expect, it } from 'vitest'
import { pluckPath } from './pluck-path.ts'

describe('pluckPath', () => {
	it('should pluck the correct path from objects in the list', () => {
		const list = [
			{ a: { b: 1 }, c: 2 },
			{ a: { b: 3 }, c: 4 }
		]
		const result = pluckPath(['a', 'b'] as const, list)
		expect(result).toEqual([1, 3])
	})

	it('should handle empty list', () => {
		const list: Array<{ a: { b: number }; c: number }> = []
		const result = pluckPath(['a', 'b'] as const, list)
		expect(result).toEqual([])
	})
})
