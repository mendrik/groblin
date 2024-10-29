import type { AnyFn } from '@tp/functions.ts'

export const initial = <Fn extends AnyFn>(fn: Fn): Fn => {
	fn()
	return fn
}
