import {
	array,
	boolean,
	iso,
	NEVER,
	number,
	strictObject as object,
	string,
	tuple,
	union,
	ZodError
} from 'zod'
import { normalizeArticle } from './article-assets.ts'
import {
	choiceSettingsSchema,
	numberSettingsSchema,
	parseNodeSettings
} from './node-settings.ts'
import { NodeType } from './node-types.ts'

export const stringValueSchema = object({ content: string() })
export const articleValueSchema = object({
	content: string().max(2 * 1024 * 1024),
	assets: array(string()).max(1000).optional()
}).transform((value, ctx) => {
	try {
		return normalizeArticle(value.content)
	} catch {
		ctx.addIssue({
			code: 'custom',
			message: 'Article nesting exceeds the supported depth'
		})
		return NEVER
	}
})
export const numberValueSchema = object({ figure: number().finite() })
export const booleanValueSchema = object({ state: boolean() })
export const choiceValueSchema = object({ selected: string() })
export const dateValueSchema = object({
	date: union([iso.date(), iso.datetime({ offset: true })])
})
const channel = number().min(0).max(255)
export const colorValueSchema = object({
	rgba: union([
		tuple([channel, channel, channel]),
		tuple([channel, channel, channel, number().min(0).max(1)])
	])
})
export const mediaValueSchema = object({
	name: string().min(1),
	file: string().min(1),
	contentType: string().min(1),
	size: number().int().nonnegative(),
	width: number().int().positive().max(16384).optional(),
	height: number().int().positive().max(16384).optional()
})
export const listValueSchema = object({ name: string() })

const contentSchemas = {
	[NodeType.string]: stringValueSchema,
	[NodeType.article]: articleValueSchema,
	[NodeType.number]: numberValueSchema,
	[NodeType.boolean]: booleanValueSchema,
	[NodeType.choice]: choiceValueSchema,
	[NodeType.date]: dateValueSchema,
	[NodeType.color]: colorValueSchema,
	[NodeType.media]: mediaValueSchema,
	[NodeType.list]: listValueSchema
}

export function parseContentValue(
	type: NodeType,
	input: unknown,
	rawSettings: unknown = {}
) {
	if (type === NodeType.root || type === NodeType.object)
		throw new ZodError([
			{ code: 'custom', path: [], message: 'Containers do not hold values' }
		])
	const value = contentSchemas[type].parse(input)
	const settings = parseNodeSettings(type, rawSettings)
	const fail = (path: string, message: string): never => {
		throw new ZodError([{ code: 'custom', path: [path], message }])
	}
	if (settings.required && 'content' in value && !value.content.trim())
		fail('content', 'This field is required')
	if (type === NodeType.number && 'figure' in value) {
		const { minimum, maximum } = numberSettingsSchema.parse(settings)
		if (minimum !== undefined && value.figure < minimum)
			fail('figure', `Value must be at least ${minimum}`)
		if (maximum !== undefined && value.figure > maximum)
			fail('figure', `Value must be at most ${maximum}`)
	}
	if (type === NodeType.choice && 'selected' in value) {
		const { choices } = choiceSettingsSchema.parse(settings)
		if (!choices.includes(value.selected))
			fail('selected', 'Select an available choice')
	}
	return value
}
