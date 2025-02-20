import { Maybe } from 'purify-ts'
import { concat, join, pipe, reduce, split, zipWith } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'

const filterEmptyParams = pipe(
	split('&'),
	reduce((acc: string[], param: string) => {
		const [key, value] = split('=', param)
		return !!key && !!value
			? [...acc, `${key}=${encodeURIComponent(value)}`]
			: acc
	}, []),
	join('&')
)
// Helper function to process the URL
export const url = (
	strings: TemplateStringsArray,
	...values: string[]
): string => {
	const pad = Array(strings.length - values.length).fill('')
	const combinedUrl = zipWith<string, string, string>(
		concat,
		strings,
		values.map(encodeURIComponent).concat(pad)
	).join('')
	const [baseUrl, queryString] = split('?', combinedUrl)
	const processedQuery = Maybe.fromNullable(queryString)
		.map(filterEmptyParams) // Rejoin into a query string
		.filter(isNotNilOrEmpty) // Remove if empty
		.map(concat('?')) // Add `?` back
		.orDefault('') // Default to empty string if no query
	return `${baseUrl}${processedQuery}`
}
