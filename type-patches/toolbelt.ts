export type NonEmptyArray<T> = [T, ...T[]]

export type Path<T> = T extends object
	? (keyof T | [keyof T, ...Path<T[keyof T]>])[] // If it's an object, allow recursive paths
	: never

export type Brand<K, T> = K & { __brand: T }
