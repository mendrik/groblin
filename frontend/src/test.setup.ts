import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

export const inputText = (value: string) => (el: HTMLElement) => {
	fireEvent.change(el, {
		target: { value }
	})
}

vi.mock('graphql-ws', () => ({
	createClient: vi.fn()
}))
