import {
	type ReadonlySignal,
	type Signal,
	computed,
	signal
} from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import type { Fn } from '@tp/functions'
import { curry, prop } from 'ramda'
import {} from 'react'

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

export type Job<T, A extends any[]> = {
	run: (...args: A) => void
} & (
	| {
			state: 'idle' | 'working'
	  }
	| {
			state: 'done'
			data: T
	  }
	| {
			state: 'error'
			error: Error
	  }
)

export const job = <T, A extends any[]>(
	promiseFn: (...args: A) => Promise<T>
): Job<T, A> => {
	const $state = signal<Job<T, A>['state']>('idle')
	const $data = signal<T>()
	const $error = signal<Error>()

	const run = (...args: A) =>
		promiseFn(...args)
			.then(d => {
				setSignal($data, d)
				setSignal($state, 'done')
			})
			.catch(e => {
				setSignal($error, e)
				setSignal($state, 'error')
			})

	return {
		run(...args: A) {
			setSignal($state, 'working')
			run(...args)
		},
		get state() {
			return $state.value
		},
		get data() {
			return notNil($data)
		},
		get error() {
			return notNil($error)
		}
	}
}
