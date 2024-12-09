import { path, type Path as RPath, map } from 'ramda'

type Path<T> = T extends object
	? { [K in keyof T]: [K, ...Path<T[K]>] }[keyof T]
	: []

// Type that resolves the type at the end of the path
type ResolvedPathType<T, P extends Path<T>> = P extends []
	? never
	: P extends [infer Head, ...infer Tail]
		? Head extends keyof T
			? Tail extends Path<T[Head]>
				? ResolvedPathType<T[Head], Tail>
				: never
			: never
		: never

// Function that plucks values based on the given path
export const pluckPath =
	<T>(p: Path<T>) =>
	(list: T[]): Array<ResolvedPathType<T, P>> =>
		map(path(p as RPath), list) as Array<ResolvedPathType<T, P>>
