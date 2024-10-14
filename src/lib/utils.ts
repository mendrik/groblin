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
