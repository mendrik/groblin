import type { SyntheticEvent } from 'react'

export const data =
	(key: string) =>
	<E extends Element, N>(e: SyntheticEvent<E, N>) => {
		if (e.target instanceof HTMLElement) {
			return e.target.dataset[key]
		}
	}

export const focusWithin = (container: HTMLElement | null) => (): boolean => {
	console.log(container)
	return container?.matches(':focus-within') ?? false
}
