import { equals } from 'ramda'
import { describe, expect, it } from 'vitest'
import {
	appendFirst,
	findNextElement,
	findPrevElement,
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
