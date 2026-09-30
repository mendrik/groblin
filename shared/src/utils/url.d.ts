/**
 * url is a tagged template literal function that takes a string and values and returns a URL string.
 * It will encode the values if they are part of the query string and remove empty query parameters.
 * @param strings
 * @param values
 * @returns a curated URL string
 */
export declare const url: (
	strings: TemplateStringsArray,
	...values: (number | boolean | string | undefined)[]
) => string
