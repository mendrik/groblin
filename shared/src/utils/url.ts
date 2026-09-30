/** Interpolate a URL, encoding query values and omitting empty query parameters. */
export const url = (
	strings: TemplateStringsArray,
	...values: (number | boolean | string | undefined)[]
): string => {
	let result = ''
	for (let index = 0; index < strings.length; index++) {
		result += strings[index]
		if (index < values.length) {
			const value = values[index] == null ? '' : String(values[index])
			result += result.includes('?') ? encodeURIComponent(value) : value
		}
	}
	const separator = result.indexOf('?')
	if (separator < 0) return result
	const base = result.slice(0, separator)
	const query = result
		.slice(separator + 1)
		.split('&')
		.filter(part => {
			const equals = part.indexOf('=')
			return equals > 0 && equals < part.length - 1
		})
		.join('&')
	return query ? `${base}?${query}` : base
}
