import type { SyntheticEvent } from 'react'

export const data =
	<FN extends (value: string) => any>(key: string, fn?: FN) =>
	<E extends Element, N>(
		e: SyntheticEvent<E, N>
	): ReturnType<FN> | undefined => {
		if (e.target instanceof HTMLElement) {
			const value = e.target.dataset[key]
			if (value) {
				return fn ? fn(value) : value
			}
		}
	}

export const focusWithin = (container: HTMLElement | null) => (): boolean =>
	container?.matches(':focus-within') ?? false
