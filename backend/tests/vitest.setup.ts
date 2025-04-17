import type { Pool, TestProject } from 'vitest/node'

import type { Container } from 'inversify'
import { testDb } from './test-context.ts'

declare module 'vitest' {
	export interface TestContext {
		pool: Pool
		container: Container
		query: (query: string) => Promise<any>
	}
}

export default async function setup(_project: TestProject) {
	return async () => await testDb.stop()
}
