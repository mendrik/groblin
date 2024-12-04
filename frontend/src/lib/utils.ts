import {
	type ReadonlySignal,
	type Signal,
	computed
} from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import type { Fn } from '@tp/functions'
import { type ClassValue, clsx } from 'clsx'
import { curry, prop } from 'ramda'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const setSignal = curry(<T>(signal: Signal<T>, value: T): T => {
	signal.value = value
	return value
})

export const updateSignalFn = curry(
	<T, INP>(
		signal: Signal<T>,
		fn: (arg: INP, cur: T) => T
	): ((a: INP) => unknown) =>
		(arg: INP) =>
			(signal.value = fn(arg, signal.value))
)

export const updateSignal: {
	<T>(signal: Signal<T>, fn: Fn<T, T>): void
	<T>(signal: Signal<T>): <T2 extends T>(fn: Fn<T2, T2>) => void
} = curry(
	<T>(signal: Signal<T>, fn: Fn<T, T>) => (signal.value = fn(signal.value))
)

export const notNil: {
	<T>(signal: Signal<T>): NonNullable<T>
	<T, P extends keyof NonNullable<T>>(
		signal: Signal<T>,
		props: P
	): NonNullable<T>[P]
} = (signal: Signal<any>, propName?: string) => {
	const res = propName ? prop(propName, signal.value) : signal.value

	propName && !res && console.log(signal.value, res, propName)

	assertExists(
		res,
		propName
			? `Signal value (${propName as string}) is nil`
			: 'Signal value is nil'
	)
	return res
}

export const safeSignal: {
	<T>(signal: Signal<T>): NonNullable<T>
	<T, P extends keyof NonNullable<T>>(
		signal: Signal<T>,
		props: P
	): NonNullable<T>[P]
} = (signal: Signal<any>, propName?: string) => {
	return propName ? prop(propName, signal.value ?? {}) : signal.value
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
