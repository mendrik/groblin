import type { TestProject } from 'vitest/node'

import { testDb } from './test-context.ts'

export default async function setup(_project: TestProject) {
	return async () => await testDb.stop()
}
