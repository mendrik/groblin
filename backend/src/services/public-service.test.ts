import { txTest } from 'tests/transactional-test.ts'
import { describe } from 'vitest'

describe('PublicService', () => {
	txTest('should be defined', ({ container }) => {
		console.dir(container)
	})
})
