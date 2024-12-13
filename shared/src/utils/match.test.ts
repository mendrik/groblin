import { T as _, equals, gt, is, isEmpty, values } from 'ramda'
import { isNumber, isOdd, isString } from 'ramda-adjunct'
import { describe, expect, it } from 'vitest'
import { ZodNativeEnum, type ZodTypeAny, nativeEnum } from 'zod'
import { caseOf, match } from './match'

describe('pattern', () => {
	it('should match the correct case', () => {
		const matcher = match<[string | number | boolean, number], string>(
			caseOf(
				[isString, equals(42)],
				(r1, r2) => `string: ${r1}, number: ${r2}`
			),
			caseOf(
				[isNumber, equals(10)],
				(r3, r4) => `number: ${r3}, number: ${r4}`
			),
			caseOf(
				[() => true, gt(20)],
				(r5, r6) => `string | number | boolean: ${r5}, number: ${r6}`
			)
		)

		expect(matcher('hello', 42)).toBe('string: hello, number: 42')
		expect(matcher(30, 10)).toBe('number: 30, number: 10')
		expect(matcher(true, 8)).toBe('string | number | boolean: true, number: 8')
	})

	it('should infer complex types', () => {
		enum Test {
			a = 'a',
			b = 'b'
		}

		const matcher = match<[ZodTypeAny], string>(
			caseOf([is(ZodNativeEnum)], r1 => `enum: ${values(r1.enum)}`)
		)
		expect(matcher(nativeEnum(Test))).toBe('enum: a,b')
	})

	it('should match number types', () => {
		const matcher = match<[number, number], string>(
			caseOf([3, _], () => `match`),
			caseOf([_, _], () => `no match`)
		)
		expect(matcher(3, 5)).toBe('match')
		expect(matcher(4, 5)).toBe('no match')
	})

	it('should match number types', () => {
		const matcher = match<[string, string], string>(
			caseOf(['a', 'b'], () => `match`),
			caseOf(['c', 'd'], () => `match`),
			caseOf(['e', 'f'], () => `match`),
			caseOf([_, _], () => `no match`)
		)
		expect(matcher('a', 'b')).toBe('match')
		expect(matcher('c', 'd')).toBe('match')
		expect(matcher('e', 'f')).toBe('match')
		expect(matcher('e', 'g')).toBe('no match')
	})

	it('should match object', () => {
		const matcher = match<[object], string>(
			caseOf([{ a: 4, b: 2 }], () => `match`),
			caseOf([{ a: 1 }], () => `match`),
			caseOf([{ b: 2 }], () => `match`),
			caseOf([_], () => `no match`)
		)

		expect(matcher({ a: 1 })).toBe('match')
		expect(matcher({ e: 'a', b: 2 })).toBe('match')
		expect(matcher({ a: 4, b: 2 })).toBe('match')
		expect(matcher({ b: 3 })).toBe('no match')
		expect(matcher({ a: 2, c: 3 })).toBe('no match')
	})

	it('should match object matchers', () => {
		const matcher = match<[object], string>(
			caseOf([{ a: isEmpty }], () => `match`),
			caseOf([_], () => `no match`)
		)

		expect(matcher({ a: [] })).toBe('match')
		expect(matcher({ a: [1, 2, 3] })).toBe('no match')
	})

	it('should match array matchers', () => {
		const matcher = match<[[number, number | string]], string>(
			caseOf([[isOdd, isString]], ([a, b]) => `match`),
			caseOf([_], () => `no match`)
		)

		expect(matcher([1, '2'])).toBe('match')
		expect(matcher([2, 2])).toBe('no match')
	})

	it('should match array matchers', () => {
		const matcher = match<[{ a: number | string }], string>(
			caseOf([{ a: isString }], ({ a }) => `match`),
			caseOf([_], () => `no match`)
		)

		expect(matcher({ a: 'a' })).toBe('match')
		expect(matcher({ a: 1 })).toBe('no match')
	})
})
