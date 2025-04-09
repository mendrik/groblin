import { txTest } from 'tests/transactional-test.ts'
import { describe } from 'vitest'
import { PublicService } from './public-service.ts'

describe('PublicService', () => {
	txTest('should be defined', ({ container }) => {
		console.dir(container.get(PublicService), { depth: 10 })
	})
})
