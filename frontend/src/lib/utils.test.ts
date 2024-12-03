import { signal } from '@preact/signals-react'
import { setMonth } from 'date-fns/fp'
import { describe, expect, it } from 'vitest'
import { notNil, updateSignalFn } from './utils'

describe('notNil', () => {
	it('should return the value when the signal is not nil', () => {
		const s = signal('test')
		const result = notNil(s)
		expect(result).toBe('test')
	})

	it('should throw an error when the signal is nil', () => {
		const s = signal()
		expect(() => notNil(s)).toThrow('Signal value is nil')
	})

	it('should return the nested property value when the signal is not nil', () => {
		const s = signal({ root: { nested: 'test' } })
		const result = notNil(s, 'root')
		expect(result).toEqual({ nested: 'test' })
	})

	it('should work with arrays', () => {
		const s = signal(['a', 'b', 'c'])
		expect(notNil(s, 1)).toEqual('b')
	})

	it('should work with arrays', () => {
		const s = signal(['a', 'b', 'c'])
		expect(() => notNil(s, 5)).toThrow('Signal value (5) is nil')
	})

	it('updateSignalFn should update the signal', () => {
		const $test = signal({ date: new Date(2023, 5, 1) })
		const updateDate = (fn: (d: Date) => Date) =>
			($test.value.date = fn($test.value.date))

		updateDate(setMonth(6))
		expect($test.value.date.getMonth()).toBe(6)
	})

	it('updateSignalFn should update the signal', () => {
		const $test = signal({ date: new Date(2023, 5, 1) })
		const updateDate = updateSignalFn($test, setMonth)
		updateDate(6)
		expect($test.value.date.getMonth()).toBe(6)
	})
})
