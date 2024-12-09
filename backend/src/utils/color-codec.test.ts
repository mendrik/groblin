import { describe, expect, it } from 'vitest'
import { color } from './color-codec.ts'

describe('color codec', () => {
	it('should parse valid hex color', () => {
		const result = color.parse('#ff0000')
		expect(result).toEqual([255, 0, 0, 1])
	})

	it('should parse valid short hex color', () => {
		const result = color.parse('#f00')
		expect(result).toEqual([255, 0, 0, 1])
	})

	it('should parse valid hex color with alpha', () => {
		const result = color.parse('#ff000080')
		expect(result).toEqual([255, 0, 0, 0.5])
	})

	it('should parse valid rgb color', () => {
		const result = color.parse('rgb(255, 0, 0)')
		expect(result).toEqual([255, 0, 0, 1])
	})

	it('should parse valid rgba color', () => {
		const result = color.parse('rgba(255, 0, 0, 0.5)')
		expect(result).toEqual([255, 0, 0, 0.5])
	})

	it('should parse valid hsl color', () => {
		const result = color.parse('hsl(0, 100%, 50%)')
		expect(result).toEqual([255, 0, 0, 1])
	})

	it('should parse valid hsla color', () => {
		const result = color.parse('hsla(0, 100%, 50%, 0.5)')
		expect(result).toEqual([255, 0, 0, 0.5])
	})

	it('should throw error for invalid hex color', () => {
		expect(() => color.parse('#ggg')).toThrowError('Invalid color')
	})
})
