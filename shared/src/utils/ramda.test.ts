import { describe, expect, it, vi } from 'vitest'
import { findKeysByValue, pipeTap, pipeTapAsync } from './ramda.ts'

// Tests for pipeTap
describe('pipeTap', () => {
	it("each function with the original argument called and returns the last function's result", () => {
		const fn1 = vi.fn((x: number) => x + 1)
		const fn2 = vi.fn((x: number) => x * 2)
		const fn3 = vi.fn((x: number) => x - 3)

		const result = pipeTap<number, any[]>(fn1, fn2, fn3)(5)

		expect(fn1).toHaveBeenCalledWith(5)
		expect(fn2).toHaveBeenCalledWith(5)
		expect(fn3).toHaveBeenCalledWith(5)
		expect(result).toBe(2) // The result of the last function (5 - 3 = 2)
	})

	it('side effects like console.log and still return the last value', () => {
		const consoleSpy = vi.spyOn(console, 'log')

		const result = pipeTap<number, any[]>(
			(x: number) => console.log('Fn1:', x),
			(x: number) => console.log('Fn2:', x),
			(x: number) => x * 10
		)(3)

		expect(consoleSpy).toHaveBeenCalledWith('Fn1:', 3)
		expect(consoleSpy).toHaveBeenCalledWith('Fn2:', 3)
		expect(result).toBe(30) // Last function returns 3 * 10

		consoleSpy.mockRestore()
	})

	it('should handle async functions and await promises', async () => {
		const fn1 = vi.fn(async (x: number) => x + 1)
		const fn2 = vi.fn(() => new Promise(res => setTimeout(res, 50)))
		const fn3 = vi.fn((x: number) => x - 3)

		const result = await pipeTapAsync<number, any[]>(fn1, fn2, fn3)(5)

		expect(fn1).toHaveBeenCalledWith(5)
		expect(fn2).toHaveBeenCalledWith(5)
		expect(fn3).toHaveBeenCalledWith(5)
		expect(result).toBe(2) // The result of the last function (5 - 3 = 2)
	})

	it('should handle mixed functions and await promises', async () => {
		const consoleSpy = vi.spyOn(console, 'log')
		const fn1 = vi.fn(() => console.log('fn1'))
		const fn2 = vi.fn(() =>
			new Promise(res => setTimeout(res, 10)).then(() => console.log('fn2'))
		)
		const fn3 = vi.fn(() => console.log('fn3'))

		const result = await pipeTapAsync<number, any[]>(fn1, fn2, fn3)(5)

		expect(fn1).toHaveBeenCalledWith(5)
		expect(fn2).toHaveBeenCalledWith(5)
		expect(fn3).toHaveBeenCalledWith(5)
		expect(result).toBe(void 0)

		expect(consoleSpy).toHaveBeenNthCalledWith(1, 'fn1')
		expect(consoleSpy).toHaveBeenNthCalledWith(2, 'fn2')
		expect(consoleSpy).toHaveBeenNthCalledWith(3, 'fn3')

		consoleSpy.mockRestore()
	})
})

describe('findKeysByValue', () => {
	it('should return all keys matching the specified value', () => {
		const record = { a: 1, b: 2, c: 1, d: 3 }
		const result = findKeysByValue(1)(record)
		expect(result).toEqual(['a', 'c'])
	})

	it('should return an empty array if no keys match the specified value', () => {
		const record = { a: 'x', b: 'y', c: 'z' }
		const result = findKeysByValue('a')(record)
		expect(result).toEqual([])
	})

	it('should handle an empty record', () => {
		const record = {} as Record<string, number>
		const result = findKeysByValue(1)(record)
		expect(result).toEqual([])
	})

	it('should handle records with different value types', () => {
		const record = { a: true, b: false, c: true }
		const result = findKeysByValue(true)(record)
		expect(result).toEqual(['a', 'c'])
	})

	it('should work with complex value types', () => {
		const obj = { id: 1 }
		const record = { a: obj, b: { id: 2 }, c: obj }
		const result = findKeysByValue(obj)(record)
		expect(result).toEqual(['a', 'c'])
	})
})
