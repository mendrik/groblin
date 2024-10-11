import type { Signal } from '@preact/signals-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const setSignal =
	<T>(signal: Signal<T>) =>
	(value: T) =>
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		(signal.value = value)
