export type NonEmptyArray<T> = [T, ...T[]]

export type Path<T> = T extends object
	? (keyof T | [keyof T, ...Path<T[keyof T]>])[] // If it's an object, allow recursive paths
	: never

export type Brand<K, T> = K & { __brand: T }

export type Primitive = string | number | boolean | null | undefined

export type DeepPartial<T> = T extends Primitive
	? T
	: T extends Array<infer U>
		? Array<DeepPartial<U>>
		: T extends ReadonlyArray<infer U>
			? ReadonlyArray<DeepPartial<U>>
			: T extends Map<infer K, infer V>
				? Map<DeepPartial<K>, DeepPartial<V>>
				: T extends ReadonlyMap<infer K, infer V>
					? ReadonlyMap<DeepPartial<K>, DeepPartial<V>>
					: T extends Set<infer U>
						? Set<DeepPartial<U>>
						: T extends ReadonlySet<infer U>
							? ReadonlySet<DeepPartial<U>>
							: { [K in keyof T]?: DeepPartial<T[K]> }
