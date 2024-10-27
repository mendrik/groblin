import { equals, gt, is, values } from 'ramda'
import { isNumber, isString } from 'ramda-adjunct'
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
})
