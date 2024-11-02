import { isPromise } from 'ramda-adjunct'

export type Resolved<T> = {
	[K in keyof T]: T[K] extends Promise<infer R> ? R : T[K]
}

export async function resolveObj<T extends Record<string, any>>(
	obj: T
): Promise<Resolved<T>> {
	const keys = Object.keys(obj) as (keyof T)[]
	const resolvedEntries = await Promise.all(
		keys.map(async key => {
			const value = obj[key]
			return [key, isPromise(value) ? await value : value] as [
				keyof T,
				Resolved<T>[keyof T]
			]
		})
	)

	return Object.fromEntries(resolvedEntries) as Resolved<T>
}
