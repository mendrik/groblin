import { path, hasPath } from 'ramda'

export const replacePlaceholders =
	(values: Record<string, any>) =>
	(template: string): string =>
		template.replace(/\{\{\s*([\w|.]+)\s*\}\}/g, (match, key) => {
			const p = key.split('.')
			return hasPath(p, values) ? path(p, values) : match
		})
