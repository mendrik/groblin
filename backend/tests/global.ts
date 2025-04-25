import type { Container } from 'inversify'
import type { Pool } from 'pg'
import type { Sdk } from './test-sdk.ts'

declare module 'vitest' {
	export interface TestContext {
		pool: Pool
		container: Container
		sdk: Sdk
	}
}

export default async function globalSetup() {
}