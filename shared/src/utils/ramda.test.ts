import { describe, expect, it } from 'vitest'
import { addOrder, capitalize, entriesWithIndex } from './ramda.ts'

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
