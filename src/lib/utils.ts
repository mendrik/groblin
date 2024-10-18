import type { Fn } from '@/type-patches/functions'
import type { Signal } from '@preact/signals-react'
import { type ClassValue, clsx } from 'clsx'
import { curry } from 'purify-ts'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const setSignal = curry(<T>(signal: Signal<T>, value: T) => {
	signal.value = value
})

export const updateSignal = curry(<T>(signal: Signal<T>, fn: Fn<T, T>) => {
	signal.value = fn(signal.value)
})

export function assertExists<T>(
	val: T | undefined,
	message: string
): asserts val is T {
	if (val == null) {
		throw new Error(message)
	}
}
