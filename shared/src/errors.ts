export const throwError = (message: string): never => {
	throw new Error(message)
}

export const throwAny = (errors: any): never => {
	throw errors
}

export const error = Symbol('error')
export const rethrow =
	(
		strings: TemplateStringsArray,
		...values: (number | boolean | string | undefined | typeof error)[]
	) =>
	(err: Error): never => {
		const message = strings.reduce(
			(result, text, index) =>
				result +
				text +
				(index < values.length
					? values[index] === error
						? err.message
						: String(values[index])
					: ''),
			''
		)
		throw new Error(message, { cause: err })
	}
