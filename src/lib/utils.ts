import type { Fn } from '@/type-patches/functions'
import type { Signal } from '@preact/signals-react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const setSignal =
	<T>(signal: Signal<T>) =>
	(value: T) => {
		signal.value = value
	}

export const updateSignal =
	<T>(signal: Signal<T>) =>
	(fn: Fn<T, T>) => {
		signal.value = fn(signal.value)
	}
