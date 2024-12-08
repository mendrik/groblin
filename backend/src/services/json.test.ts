import { describe, expect, test } from 'vitest'

import { traverse } from './json.ts'

describe('traverse', () => {
	test('should handle undefined input', () => {
		const result = Array.from(traverse(undefined))
		expect(result).toEqual([])
	})

	test('should handle null input', () => {
		const result = Array.from(traverse(null))
		expect(result).toEqual([])
	})

	test('should handle empty object', () => {
		const result = Array.from(traverse({}))
		expect(result).toEqual([])
	})

	test('should handle empty array', () => {
		const result = Array.from(traverse([]))
		expect(result).toEqual([])
	})

	test('should traverse a simple object', () => {
		const json = { a: 1, b: 2 }
		const result = [...traverse(json)]
		expect(result).toEqual([
			{ key: ['a'], value: 1 },
			{ key: ['b'], value: 2 }
		])
	})

	test('should traverse a nested object', () => {
		const json = { a: { b: 2 } }
		const result = [...traverse(json)]
		expect(result).toEqual([{ key: ['a', 'b'], value: 2 }])
	})

	test('should traverse an array', () => {
		const json = [1, 2, 3]
		const result = [...traverse(json)]
		expect(result).toEqual([
			{ key: [0], value: 1 },
			{ key: [1], value: 2 },
			{ key: [2], value: 3 }
		])
	})

	test('should traverse a nested array', () => {
		const json = [
			[1, 2],
			[3, 4]
		]
		const result = [...traverse(json)]
		expect(result).toEqual([
			{ key: [0, 0], value: 1 },
			{ key: [0, 1], value: 2 },
			{ key: [1, 0], value: 3 },
			{ key: [1, 1], value: 4 }
		])
	})

	test('should traverse a complex structure', () => {
		const json = { a: [1, { b: 2 }] }
		const result = [...traverse(json)]
		expect(result).toEqual([
			{ key: ['a', 0], value: 1 },
			{ key: ['a', 1, 'b'], value: 2 }
		])
	})
})
