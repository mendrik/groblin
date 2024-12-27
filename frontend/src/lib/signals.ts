import {
	type ReadonlySignal,
	type Signal,
	computed,
	signal
} from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import type { Fn } from '@tp/functions'
import { assoc, curry, prop } from 'ramda'

export const setSignal = curry(<T>(signal: Signal<T>, value: T): T => {
	signal.value = value
	return value
})

export const updateSignalFn = curry(
	<T, INP>(signal: Signal<T>, fn: (arg: INP, cur: T) => T) =>
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

	assertExists(
		res,
		propName
			? `Signal value (${propName as string}) is nil`
			: 'Signal value is nil'
	)
	return res
}

export const computeSignal = <T, R>(
	signal: Signal<T>,
	fn: (v: T) => R
): ReadonlySignal<R> => computed(() => fn(signal.value))

type PromisedSignal<T> =
	| {
			loading: true
			error: null
			data: null
	  }
	| {
			loading: false
			error: Error
			data: null
	  }
	| {
			loading: false
			error: null
			data: T
	  }

const promiseMap = new WeakMap<Promise<any>, Signal<PromisedSignal<any>>>()

export const job = <T>(promise: Promise<T>) => {
	if (promiseMap.has(promise)) {
		return promiseMap.get(promise)
	}
	const sig = signal<PromisedSignal<T>>({
		loading: true,
		error: null,
		data: null
	})
	promise
		.then(updateSignalFn(sig, assoc('data')))
		.catch(updateSignalFn(sig, assoc('error')))
		.finally(() => updateSignal(sig, assoc('loading', false)))

	promiseMap.set(promise, sig)
	return sig
}
