import { equals } from 'ramda'
import { describe, expect, it, vi } from 'vitest'
import {
	appendFirst,
	findNextElement,
	findPrevElement,
	pipeTap,
	prependLast
} from './ramda.ts'

describe('listToTree', () => {
	it('appendFirst', () => {
		const xs = [1, 2, 3, 4, 5]
		expect(appendFirst(xs)).toEqual([1, 2, 3, 4, 5, 1])
	})

	it('prependLast', () => {
		const xs = [1, 2, 3, 4, 5]
		expect(prependLast(xs)).toEqual([5, 1, 2, 3, 4, 5])
	})

	it('findNextElement', () => {
		const xs = [1, 2, 3, 4, 5]
		expect(findNextElement(equals(3))(xs)).toBe(4)
	})

	it('findNextElement: end of list', () => {
		const xs = [1, 2, 3, 4, 5]
		expect(findNextElement(equals(5))(xs)).toBe(1)
	})

	it('findPrevElement', () => {
		const xs = [1, 2, 3, 4, 5]
		expect(findPrevElement(equals(3))(xs)).toBe(2)
	})

	it('findPrevElement: head of list', () => {
		const xs = [1, 2, 3, 4, 5]
		expect(findPrevElement(equals(1))(xs)).toBe(5)
	})
})

// Tests for pipeTap
describe('pipeTap', () => {
	it("should call each function with the original argument and return the last function's result", () => {
		const fn1 = vi.fn((x: number) => x + 1)
		const fn2 = vi.fn((x: number) => x * 2)
		const fn3 = vi.fn((x: number) => x - 3)

		const result = pipeTap(fn1, fn2, fn3)(5)

		expect(fn1).toHaveBeenCalledWith(5)
		expect(fn2).toHaveBeenCalledWith(5)
		expect(fn3).toHaveBeenCalledWith(5)
		expect(result).toBe(2) // The result of the last function (5 - 3 = 2)
	})

	it('should work with side effects like console.log and still return the last value', () => {
		const consoleSpy = vi.spyOn(console, 'log')

		const result = pipeTap(
			(x: number) => console.log('Fn1:', x),
			(x: number) => console.log('Fn2:', x),
			(x: number) => x * 10
		)(3)

		expect(consoleSpy).toHaveBeenCalledWith('Fn1:', 3)
		expect(consoleSpy).toHaveBeenCalledWith('Fn2:', 3)
		expect(result).toBe(30) // Last function returns 3 * 10

		consoleSpy.mockRestore()
	})
})
