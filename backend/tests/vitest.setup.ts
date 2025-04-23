import { error, rethrow } from '@shared/errors.ts'
import type { Container } from 'inversify'
import type { Pool, TestProject } from 'vitest/node'
import type { Sdk } from './test-sdk.ts'

declare module 'vitest' {
	export interface TestContext {
		pool: Pool
		container: Container
		sdk: Sdk
	}
}

export default async function setup(_project: TestProject) {
	console.log('Running global setup')

	return await import('./test-context.ts')
		.then(
			({ testDb }) =>
				() =>
					testDb.stop()
		)
		.catch(rethrow`Global test context setup failed: ${error}`)
}
