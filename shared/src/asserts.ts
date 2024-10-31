export function assertExists<T>(
	val: T | undefined | null,
	message: string
): asserts val is T {
	if (val == null) {
		throw new Error(message)
	}
}

export function assertThat<T, R extends T>(
	predicate: ((val: T) => val is R) | ((val: T) => boolean),
	val: T,
	message?: string
): asserts val is R {
	if (!predicate(val)) {
		throw new Error(message ?? `${val} is ${typeof val}`)
	}
}
