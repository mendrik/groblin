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
	val: T | undefined | null,
	message: string
): asserts val is T {
	if (val == null) {
		throw new Error(message)
	}
}

export function assertThat<T, R extends T>(
	predicate: (val: T) => val is R,
	val: T,
	message: string
): asserts val is R {
	if (!predicate(val)) {
		throw new Error(`${message}: ${val} is ${typeof val}`)
	}
}

export const failOnNil =
	<T>(message: string) =>
	(val: T | null | undefined): T => {
		if (val == null) {
			throw new Error(message)
		}
		return val
	}
