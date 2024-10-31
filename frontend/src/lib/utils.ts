import type { Signal } from '@preact/signals-react'
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
