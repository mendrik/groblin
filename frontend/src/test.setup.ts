import { vi } from 'vitest'

vi.mock('graphql-ws', () => ({
	createClient: vi.fn()
}))
