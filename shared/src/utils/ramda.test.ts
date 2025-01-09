import { describe, expect, it } from 'vitest'
import {
	addOrder,
	capitalize,
	entriesWithIndex,
	fork,
	removeAt
} from './ramda.ts'

describe('addOrder', () => {
	it('should add an order property to each object in the array', () => {
		const input = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]
		const result = addOrder('order')(input)
		expect(result).toEqual([
			{ name: 'Alice', order: 0 },
			{ name: 'Bob', order: 1 },
			{ name: 'Charlie', order: 2 }
		])
	})

	it('should return an empty array when given an empty array', () => {
		const input: { name: string }[] = []
		const result = addOrder('order')(input)
		expect(result).toEqual([])
	})

	it('should add different property names correctly', () => {
		const input = [{ name: 'Alice' }, { name: 'Bob' }]
		const result = addOrder('index')(input)
		expect(result).toEqual([
			{ name: 'Alice', index: 0 },
			{ name: 'Bob', index: 1 }
		])
	})
})

describe('capitalize', () => {
	it('should capitalize the first letter of a string', () => {
		const result = capitalize('hello')
		expect(result).toBe('Hello')
	})
})

describe('entriesWithIndex', () => {
	it('should return entries with their index', () => {
		const input = { a: 1, b: 2, c: 3 }
		const result = entriesWithIndex(input)
		expect(result).toEqual([
			['a', 1, 0],
			['b', 2, 1],
			['c', 3, 2]
		])
	})

	it('should return an empty array for an empty object', () => {
		const input = {}
		const result = entriesWithIndex(input)
		expect(result).toEqual([])
	})

	it('should handle objects with different types of values', () => {
		const input = { a: 1, b: 'string', c: true }
		const result = entriesWithIndex(input)
		expect(result).toEqual([
			['a', 1, 0],
			['b', 'string', 1],
			['c', true, 2]
		])
	})

	describe('addOrder', () => {
		it('should add an order property to each object in the array', () => {
			const input = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]
			const result = addOrder('order')(input)
			expect(result).toEqual([
				{ name: 'Alice', order: 0 },
				{ name: 'Bob', order: 1 },
				{ name: 'Charlie', order: 2 }
			])
		})

		it('should return an empty array when given an empty array', () => {
			const input: { name: string }[] = []
			const result = addOrder('order')(input)
			expect(result).toEqual([])
		})

		it('should add different property names correctly', () => {
			const input = [{ name: 'Alice' }, { name: 'Bob' }]
			const result = addOrder('index')(input)
			expect(result).toEqual([
				{ name: 'Alice', index: 0 },
				{ name: 'Bob', index: 1 }
			])
		})
	})

	describe('capitalize', () => {
		it('should capitalize the first letter of a string', () => {
			const result = capitalize('hello')
			expect(result).toBe('Hello')
		})
	})

	describe('entriesWithIndex', () => {
		it('should return entries with their index', () => {
			const input = { a: 1, b: 2, c: 3 }
			const result = entriesWithIndex(input)
			expect(result).toEqual([
				['a', 1, 0],
				['b', 2, 1],
				['c', 3, 2]
			])
		})

		it('should return an empty array for an empty object', () => {
			const input = {}
			const result = entriesWithIndex(input)
			expect(result).toEqual([])
		})

		it('should handle objects with different types of values', () => {
			const input = { a: 1, b: 'string', c: true }
			const result = entriesWithIndex(input)
			expect(result).toEqual([
				['a', 1, 0],
				['b', 'string', 1],
				['c', true, 2]
			])
		})
	})

	describe('fork', () => {
		const isEven = (n: number) => n % 2 === 0
		const isOdd = (n: number) => n % 2 !== 0

		it('should split an array into multiple arrays based on predicates', () => {
			const input = [1, 2, 3, 4, 5, 6]
			const result = fork(isEven, isOdd)(input)
			expect(result).toEqual([
				[2, 4, 6],
				[1, 3, 5]
			])
		})

		it('should handle an empty array', () => {
			const input: number[] = []
			const result = fork(isEven, isOdd)(input)
			expect(result).toEqual([[], []])
		})

		it('should handle multiple predicates', () => {
			const isGreaterThanThree = (n: number) => n > 3
			const input = [1, 2, 3, 4, 5, 6]
			const result = fork(isEven, isOdd, isGreaterThanThree)(input)
			expect(result).toEqual([
				[2, 4, 6],
				[1, 3, 5],
				[4, 5, 6]
			])
		})

		describe('removeAt', () => {
			it('should remove the element at the specified index', () => {
				const input = [1, 2, 3, 4, 5]
				const result = removeAt(2)(input)
				expect(result).toEqual([1, 2, 4, 5])
			})

			it('should return the same array if the index is out of bounds', () => {
				const input = [1, 2, 3]
				const result = removeAt(5)(input)
				expect(result).toEqual([1, 2, 3])
			})

			it('should handle negative indices by removing from the end', () => {
				const input = [1, 2, 3, 4, 5]
				const result = removeAt(-2)(input)
				expect(result).toEqual([1, 2, 3, 5])
			})

			it('should return an empty array when removing the only element', () => {
				const input = [1]
				const result = removeAt(0)(input)
				expect(result).toEqual([])
			})

			it('should handle an empty array', () => {
				const input: number[] = []
				const result = removeAt(0)(input)
				expect(result).toEqual([])
			})
		})
	})
})
