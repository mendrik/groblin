import { EditorType } from '@shared/enums'
import { describe, expect, it } from 'vitest'
import * as z from 'zod/v4'
import {
	generateDefaults,
	metas,
	stringField
} from './utils'
import { L } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js'
import { assert } from 'console'
import { assertExists } from '@shared/asserts'
import { FieldMeta } from './types'

describe('utils', () => {
	describe('zod form', () => {
		it('should detect enhanced fields', () => {
			const schema = stringField('Name', EditorType.Input)
			expect(metas.get(schema)).toMatchObject({
				label: 'Name',
				editor: EditorType.Input,
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
})
