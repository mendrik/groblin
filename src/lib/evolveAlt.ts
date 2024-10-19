// Utility types
type RequiredKeys<T> = {
	[K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

type OptionalKeys<T> = {
	[K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

// EvolveResult type
type EvolveResult<O, T> = Omit<O, keyof T> & {
	[K in keyof T]: K extends keyof O
		? K extends RequiredKeys<O>
			? T[K] extends (value: O[K]) => infer R
				? R
				: never
			: K extends OptionalKeys<O>
				? T[K] extends (object: O) => infer R
					? R
					: never
				: never
		: T[K] extends (object: O) => infer R
			? R
			: never
}

// Function type: (transformations, object)
export function evolveAlt<
	O extends object,
	T extends {
		[K in keyof T]: K extends keyof O
			? K extends RequiredKeys<O>
				? (value: O[K]) => any
				: K extends OptionalKeys<O>
					? (object: O) => any
					: never
			: (object: O) => any
	}
>(transformations: T, object: O): EvolveResult<O, T>

// Function type: (transformations) => (object)
export function evolveAlt<
	T extends {
		[K in keyof T]: any
	}
>(transformations: T): <O extends object>(object: O) => EvolveResult<O, T>

// Function implementation
export function evolveAlt(transformations: any, object?: any): any {
	if (object === undefined) {
		return (obj: any) => evolveAlt(transformations, obj)
	} else {
		const result: any = { ...object }
		for (const key in transformations) {
			const transformFn = transformations[key]
			if (Object.prototype.hasOwnProperty.call(object, key)) {
				result[key] = transformFn(object[key])
			} else if (key in object) {
				result[key] = transformFn(object)
			} else {
				result[key] = transformFn(object)
			}
		}
		return result
	}
}
