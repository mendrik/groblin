import { assertExists, assertThat } from '@shared/asserts'
import { is, tryCatch } from 'ramda'
import { delayP } from 'ramda-adjunct'
import type { RefObject, SyntheticEvent } from 'react'

export const data =
	<FN extends (value: string) => any>(key: string, transformer: FN) =>
	(e: Event | SyntheticEvent): ReturnType<FN> => {
		assertThat(is(Element), e.target, 'target is not an HTMLElement')
		const dataElement = e.target.closest(`[data-${key}]`)
		assertThat(is(HTMLElement), dataElement, 'no data attribute found')
		const value = dataElement.dataset[key]
		assertExists(value, `no data attribute found for key: ${key}`)
		return transformer(value)
	}

export const dataInt = (key: string) => data(key, Number.parseInt)

export const safeDataInt = (
	key: string
): ((e: Event | SyntheticEvent) => number | undefined) =>
	tryCatch(dataInt(key), () => undefined)

export const focusWithin = (container: HTMLElement | null): boolean =>
	container?.matches(':focus-within') ?? false

export const inputValue = <E extends SyntheticEvent | Event>(e: E): string => {
	if (e.target instanceof HTMLInputElement) {
		return e.target.value
	}
	return ''
}

export const target = <E extends SyntheticEvent>(e: E): string => {
	if (e.target instanceof HTMLInputElement) {
		return e.target.value
	}
	return ''
}

export const stopPropagation = <E extends SyntheticEvent | Event>(e: E): void =>
	e.stopPropagation()

export const preventDefault = <E extends SyntheticEvent | Event>(e: E): void =>
	e.preventDefault()

export const focusOn =
	<EL extends HTMLElement>(ref: RefObject<EL | null>) =>
	(): Promise<void> =>
		delayP(50).then(() => ref.current?.focus())
