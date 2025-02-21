import { describe, expect, it } from 'vitest'
import { decryptInteger, encryptInteger } from './number-hash.ts'

describe('encryptInteger', () => {
	it('should return a non-empty hex string', () => {
		const encrypted = encryptInteger(123)
		expect(typeof encrypted).toBe('string')
		expect(encrypted).not.toBe('')
	})

	it('should produce consistent encryption for the same input', () => {
		const input = 456
		const encryptedOnce = encryptInteger(input)
		const encryptedTwice = encryptInteger(input)
		expect(encryptedOnce).toBe(encryptedTwice)
	})

	it('should be reversible with decryptInteger', () => {
		const testNumbers = [0, 1, 98765]
		for (const num of testNumbers) {
			const encrypted = encryptInteger(num)
			const decrypted = decryptInteger(encrypted)
			expect(decrypted).toBe(num)
		}
	})
})
