import {
	type ReadonlySignal,
	type Signal,
	computed
} from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import type { Fn } from '@tp/functions'
import { type ClassValue, clsx } from 'clsx'
import { curry } from 'purify-ts'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const setSignal = curry(<T>(signal: Signal<T>, value: T): T => {
	signal.value = value
	return value
})

export const updateSignal = curry(<T>(signal: Signal<T>, fn: Fn<T, T>) => {
	signal.value = fn(signal.value)
})

export const notNil = <T>(signal: Signal<T>): NonNullable<T> => {
	assertExists(signal.value, 'Signal value is null')
	return signal.value as NonNullable<T>
}

export const computeSignal = <T, R>(
	signal: Signal<T>,
	fn: (v: T) => R
): ReadonlySignal<R> => computed(() => fn(signal.value))
