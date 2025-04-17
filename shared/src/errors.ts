import { zipWith } from 'ramda'

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
		const log = zipWith(
			(s: string, v: string) => s + v,
			strings,
			values.map(v => (v === error ? err.message : String(v)))
		)
		throw new Error(log.join(''), { cause: err })
	}
