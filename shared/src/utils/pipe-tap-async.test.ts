import { describe, expect, it, vi } from 'vitest'
import { pipeTapAsync } from './pipe-tap-async'

describe('pipeTapAsync', () => {
	it('should handle async functions and await promises', async () => {
		const fn1 = vi.fn(async (x: number) => x + 1)
		const fn2 = vi.fn(() => new Promise(res => setTimeout(res, 50)))
		const fn3 = vi.fn((x: number) => x - 3)

		const result = await pipeTapAsync(fn1, fn2, fn3)(5)

		expect(fn1).toHaveBeenCalledWith(5)
		expect(fn2).toHaveBeenCalledWith(5)
		expect(fn3).toHaveBeenCalledWith(5)
		expect(result).toBe(2) // The result of the last function (5 - 3 = 2)
	})

	it('should handle mixed functions and await promises', async () => {
		const consoleSpy = vi.spyOn(console, 'log')
		const fn1 = vi.fn((a: number) => console.log('fn1'))
		const fn2 = vi.fn(() =>
			new Promise(res => setTimeout(res, 10)).then(() => console.log('fn2'))
		)
		const fn3 = vi.fn(() => console.log('fn3'))

		const result = await pipeTapAsync(fn1, fn2, fn3)(5)

		expect(fn1).toHaveBeenCalledWith(5)
		expect(fn2).toHaveBeenCalledWith(5)
		expect(fn3).toHaveBeenCalledWith(5)
		expect(result).toBe(void 0)

		expect(consoleSpy).toHaveBeenNthCalledWith(1, 'fn1')
		expect(consoleSpy).toHaveBeenNthCalledWith(2, 'fn2')
		expect(consoleSpy).toHaveBeenNthCalledWith(3, 'fn3')

		consoleSpy.mockRestore()
	})

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
