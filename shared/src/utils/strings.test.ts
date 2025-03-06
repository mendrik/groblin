import { describe, expect, it } from 'vitest'
import { replacePlaceholders } from './strings'

describe('replacePlaceholders', () => {
	it('should replace single placeholder with value', () => {
		const template = 'Hello, {{name}}!'
		const values = { name: 'World' }
		const result = replacePlaceholders(values)(template)
		expect(result).toBe('Hello, World!')
	})

	it('should replace multiple placeholders with values', () => {
		const template = '{{greeting}}, {{name}}! Welcome to {{place}}.'
		const values = { greeting: 'Hi', name: 'User', place: 'Our Platform' }
		const result = replacePlaceholders(values)(template)
		expect(result).toBe('Hi, User! Welcome to Our Platform.')
	})

	it('should handle whitespace within placeholders', () => {
		const template = 'Hello, {{ name }}!'
		const values = { name: 'World' }
		const result = replacePlaceholders(values)(template)
		expect(result).toBe('Hello, World!')
	})

	it('should not replace placeholders with missing values', () => {
		const template = 'Hello, {{name}}! Welcome to {{place}}.'
		const values = { name: 'User' }
		const result = replacePlaceholders(values)(template)
		expect(result).toBe('Hello, User! Welcome to {{place}}.')
	})

	it('should convert non-string values to strings', () => {
		const template = 'You have {{count}} items and {{amount}} dollars.'
		const values = { count: 5, amount: 10.5 }
		const result = replacePlaceholders(values)(template)
		expect(result).toBe('You have 5 items and 10.5 dollars.')
	})

	it('should handle empty values object', () => {
		const template = 'Hello, {{name}}!'
		const values = {}
		const result = replacePlaceholders(values)(template)
		expect(result).toBe('Hello, {{name}}!')
	})

	it('should work with curried version', () => {
		const replacer = replacePlaceholders({ name: 'World', age: 42 })
		expect(replacer('Hello, {{name}}!')).toBe('Hello, World!')
		expect(replacer('You are {{age}} years old.')).toBe('You are 42 years old.')
	})

	it('should work with nested keys', () => {
		const replacer = replacePlaceholders({ user: { name: 'World' } })
		expect(replacer('Hello, {{user.name}}!')).toBe('Hello, World!')
	})
})
