import { path, hasPath } from 'ramda'

export const replacePlaceholders =
	(values: Record<string, any>) =>
	(template: string): string => {
		console.log(`string:${template}`)
		return template.replace(/\{\{\s*([\w._]+)\s*\}\}/g, (match, key) => {
			const p = key.split('.')
			return hasPath(p, values) ? path(p, values) : match
		})
	}
