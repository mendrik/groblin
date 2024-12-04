import { cleanup, fireEvent } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

export const inputText = (value: string) => (el: HTMLElement) => {
	fireEvent.change(el, {
		target: { value }
	})
}

afterEach(cleanup)

vi.mock('graphql-ws', () => ({
	createClient: vi.fn()
}))
