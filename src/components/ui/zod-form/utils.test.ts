import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { generateDefaults, isZodType, objectHandler } from './utils'

describe('utils', () => {
	describe('objectHandler', () => {
		it('should generate defaults for a ZodObject', () => {
			const schema = z.object({
				name: z.string().default('John Doe'),
				age: z.number().default(30)
			})

			const result = objectHandler(schema)
			expect(result).toEqual({
				name: 'John Doe',
				age: 30
			})
		})

		it('should return an empty object for an empty ZodObject', () => {
			const schema = z.object({})

			const result = objectHandler(schema)
			expect(result).toEqual({})
		})

		it('should handle nested ZodObjects', () => {
			const schema = z.object({
				user: z.object({
					name: z.string().default('John Doe'),
					age: z.number().default(30)
				})
			})

			const result = objectHandler(schema)
			expect(result).toEqual({
				user: {
					name: 'John Doe',
					age: 30
				}
			})
		})
	})

	describe('generateDefaults', () => {
		it('should generate defaults for a ZodObject', () => {
			const schema = z.object({
				name: z.string().default('John Doe'),
				age: z.number().default(30)
			})

			const result = generateDefaults(schema)
			expect(result).toEqual({
				name: 'John Doe',
				age: 30
			})
		})

		it('should return default value for ZodDefault', () => {
			const schema = z.string().default('Default String')

			const result = generateDefaults(schema)
			expect(result).toEqual('Default String')
		})

		it('should return undefined for unsupported ZodTypes', () => {
			const schema = z.string()

			const result = generateDefaults(schema)
			expect(result).toBeUndefined()
		})
	})

	describe('isZodType', () => {
		it('should return true for matching ZodType', () => {
			const zodString = z.string()

			const result = isZodType(z.ZodString)(zodString)
			expect(result).toBe(true)
		})

		it('should return false for non-matching ZodType', () => {
			const zodNumber = z.number()

			const result = isZodType(z.ZodString)(zodNumber)
			expect(result).toBe(false)
		})

		it('should handle instances of ZodDefault correctly', () => {
			const zodDefaultString = z.string().default('Default')

			const result = isZodType(z.ZodString)(zodDefaultString)
			expect(result).toBe(true)
		})

		it('should return false for non-ZodType instances', () => {
			const notZodType = {}
			const result = isZodType(z.ZodString)(notZodType as any)
			expect(result).toBe(false)
		})
	})
})
