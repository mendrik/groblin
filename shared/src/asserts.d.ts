export declare function assertExists<T>(
	val: T | undefined | null,
	message: string
): asserts val is T
export declare function assertThat<T, R extends T>(
	predicate: ((val: T) => val is R) | ((val: T) => boolean),
	val: T,
	message?: string
): asserts val is R
