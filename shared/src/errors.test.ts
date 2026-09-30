import { describe, expect, test } from 'vitest'
import { error, rethrow } from './errors.ts'

const fail = async () => {
	throw new Error('TestError')
}

describe('errors', () => {
	test('rethrow should allow message replacement', async () => {
		const test = () => fail().catch(rethrow`Failed with: ${error}`)
		await expect(test()).rejects.toThrow(
			expect.objectContaining({ message: 'Failed with: TestError' })
		)
	})
})

test('preserves the suffix after the final interpolation', () => {
	expect(() =>
		rethrow`Failed: ${error}; retry later`(new Error('broken'))
	).toThrow('Failed: broken; retry later')
})
