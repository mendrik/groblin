export type NonEmptyArray<T> = [T, ...T[]]

export type Path<T> = T extends object
	? { [K in keyof T]: [K, ...Path<T[K]>] }[keyof T]
	: [] // When T is not an object (base case)

export type Brand<K, T> = K & { __brand: T }
