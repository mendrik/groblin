import { describe, expect, test } from 'vitest'
import { error, log } from './errors.ts'

const fail = async () => {
	throw new Error('TestError')
}

describe('errors', () => {
	test('should allow message replacement', async () => {
		const test = () => fail().catch(log`Failed with: ${error}`)
		expect(() => test()).rejects.toThrow(
			expect.objectContaining({ message: 'Failed with: TestError' })
		)
	})
})
