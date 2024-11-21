import { describe, expect, it, vi } from 'vitest'
import { addOrder, pipeTap, pipeTapAsync } from './ramda.ts'

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

describe('pipeTapAsync', () => {
	it('should pass the correct argument to each function', async () => {
		const fn1 = vi.fn().mockResolvedValue(undefined)
		const fn2 = vi.fn().mockResolvedValue(undefined)
		const fn3 = vi.fn().mockResolvedValue(undefined)

		const result = await pipeTapAsync(fn1, fn2, fn3)('test')

		expect(fn1).toHaveBeenCalledWith('test')
		expect(fn2).toHaveBeenCalledWith('test')
		expect(fn3).toHaveBeenCalledWith('test')

		expect(result).toBeUndefined()
	})
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
