import { describe, expect, test } from 'vitest'
import { error, rethrow } from './errors.ts'

const fail = async () => {
	throw new Error('TestError')
}

describe('errors', () => {
	test('rethrow should allow message replacement', async () => {
		const test = () => fail().catch(rethrow`Failed with: ${error}`)
		expect(() => test()).rejects.toThrow(
			expect.objectContaining({ message: 'Failed with: TestError' })
		)
	})
})
