import type { SyntheticEvent } from 'react'

export const data =
	(key: string) =>
	<E extends Element, N>(e: SyntheticEvent<E, N>) => {
		if (e.target instanceof HTMLElement) {
			return e.target.dataset[key]
		}
	}

export const focusWithin = <E extends Element, N>(
	e: SyntheticEvent<E, N>
): boolean => {
	if (e.target instanceof HTMLElement) {
		return e.target.matches(':focus-within')
	}
	return false
}
