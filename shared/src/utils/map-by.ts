import type { AnyFn } from '@tp/functions.ts'

export function mapBy<T, R>(fn: (el: T) => R): (list: T[]) => Map<R, T>
export function mapBy<T, R>(fn: (el: T) => R, list: T[]): Map<R, T>
export function mapBy<T>(
	fn: (el: T) => any
): (list: T[]) => Map<ReturnType<typeof fn>, T>

export function mapBy(fn: AnyFn, list?: any[]): any {
	if (list === undefined) {
		return (list: any[]) => mapBy(fn, list)
	} else {
		const result = new Map()
		for (const el of list) {
			result.set(fn(el), el)
		}
		return result
	}
}
