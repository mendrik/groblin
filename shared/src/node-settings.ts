import { array, boolean, number, strictObject, string } from 'zod'
import { NodeType } from './node-types.ts'

export const commonSettings = {
	required: boolean().default(false),
	hideColumnHead: boolean().default(false)
}
export const basicSettingsSchema = strictObject(commonSettings)
export const numberSettingsSchema = strictObject({
	...commonSettings,
	unit: string().max(32).optional(),
	precision: number().int().min(0).max(12).default(0),
	minimum: number().finite().optional(),
	maximum: number().finite().optional()
}).refine(
	s =>
		s.minimum === undefined ||
		s.maximum === undefined ||
		s.minimum <= s.maximum,
	{ message: 'Minimum must not exceed maximum', path: ['maximum'] }
)
export const choiceSettingsSchema = strictObject({
	...commonSettings,
	choices: array(
		string()
			.regex(/^(?!__)[_A-Za-z][_0-9A-Za-z]*$/, 'Use a valid API identifier')
			.refine(
				value => !['true', 'false', 'null'].includes(value),
				'This choice name is reserved'
			)
	)
		.max(1000)
		.default([])
		.refine(
			values => new Set(values).size === values.length,
			'Choices must be unique'
		)
})
export const thumbnailSizeSchema = string()
	.regex(/^\d+(x\d+)?$/, 'Use a size such as 300 or 300x200')
	.refine(
		value =>
			value
				.split('x')
				.map(Number)
				.every(size => Number.isInteger(size) && size >= 1 && size <= 4096),
		'Thumbnail dimensions must be between 1 and 4096'
	)
export const mediaSettingsSchema = strictObject({
	...commonSettings,
	thumbnails: array(thumbnailSizeSchema).max(20).default([])
})
export const dateSettingsSchema = strictObject({
	...commonSettings,
	relative: boolean().default(false)
})
export const listSettingsSchema = strictObject({
	...commonSettings,
	scoped: boolean().default(false)
})
export const settingsSchemas = {
	[NodeType.root]: basicSettingsSchema,
	[NodeType.object]: basicSettingsSchema,
	[NodeType.string]: basicSettingsSchema,
	[NodeType.article]: basicSettingsSchema,
	[NodeType.number]: numberSettingsSchema,
	[NodeType.boolean]: basicSettingsSchema,
	[NodeType.list]: listSettingsSchema,
	[NodeType.choice]: choiceSettingsSchema,
	[NodeType.date]: dateSettingsSchema,
	[NodeType.color]: basicSettingsSchema,
	[NodeType.media]: mediaSettingsSchema
}
export const parseNodeSettings = (type: NodeType, input: unknown) =>
	settingsSchemas[type].parse(input ?? {})
