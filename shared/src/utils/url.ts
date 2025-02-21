import { Maybe } from 'purify-ts'
import {
	concat,
	filter,
	includes,
	isNotEmpty,
	join,
	match,
	o,
	pipe,
	split,
	take,
	zipWith
} from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'

const filterEmptyParams = pipe(
	split('&'),
	filter(o(isNotEmpty, match(/\w+=[^&$]+/))),
	join('&')
)

export const url = (
	strings: TemplateStringsArray,
	...values: (number | boolean | string | undefined)[]
): string => {
	const params = values.concat(Array(strings.length - values.length).fill(''))
	const combinedUrl = zipWith(
		(a = '', b = '') => `${a}`.concat(`${b}`),
		strings,
		params.map((value, index) => {
			if (value && take(index, strings).some(includes('?'))) {
				return encodeURIComponent(value)
			}
			return value
		})
	).join('')
	const [baseUrl, queryString] = split('?', combinedUrl)
	const processedQuery = Maybe.fromNullable(queryString)
		.map(filterEmptyParams) // Rejoin into a query string
		.filter(isNotNilOrEmpty) // Remove if empty
		.map(concat('?')) // Add `?` back
		.orDefault('') // Default to empty string if no query
	return `${baseUrl}${processedQuery}`
}
