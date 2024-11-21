import {
	type ReadonlySignal,
	type Signal,
	computed
} from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import type { Fn } from '@tp/functions'
import type { Path } from '@tp/toolbelt'
import { type ClassValue, clsx } from 'clsx'
import { path, curry, prop } from 'ramda'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const setSignal = curry(<T>(signal: Signal<T>, value: T): T => {
	signal.value = value
	return value
})

export const updateSignal: {
	<T>(signal: Signal<T>, fn: Fn<T, T>): void
	<T>(signal: Signal<T>): <T2 extends T>(fn: Fn<T2, T2>) => void
} = curry(<T>(signal: Signal<T>, fn: Fn<T, T>) => {
	signal.value = fn(signal.value)
})

export const notNil = <T>(
	signal: Signal<T>,
	pathOrProp?: (keyof T & (string | number)) | Path<T>
): NonNullable<T> => {
	const res = pathOrProp
		? Array.isArray(pathOrProp)
			? path(pathOrProp as Array<string | number>, signal.value)
			: prop(pathOrProp, signal.value)
		: signal.value
	assertExists(
		res,
		pathOrProp ? `Signal value (${pathOrProp}) is nil` : 'Signal value is nil'
	)
	return res as NonNullable<T>
}

export const computeSignal = <T, R>(
	signal: Signal<T>,
	fn: (v: T) => R
): ReadonlySignal<R> => computed(() => fn(signal.value))

export function hasMethod<T extends object>(
	obj: T | null | undefined,
	methodName: string
): obj is T & { [K in typeof methodName]: (...args: any[]) => any } {
	return (
		obj != null &&
		methodName in obj &&
		typeof (obj as any)[methodName] === 'function'
	)
}

export const throwError = (message: string): never => {
	throw new Error(message)
}
