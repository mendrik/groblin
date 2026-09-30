import type { infer as Infer } from 'zod'
import type {
	articleValueSchema,
	booleanValueSchema,
	choiceValueSchema,
	colorValueSchema,
	dateValueSchema,
	listValueSchema,
	mediaValueSchema,
	numberValueSchema,
	stringValueSchema
} from './content.ts'

export type StringType = Infer<typeof stringValueSchema>
export type NumberType = Infer<typeof numberValueSchema>
export type MediaType = Infer<typeof mediaValueSchema>
export type DateType = Infer<typeof dateValueSchema>
export type ColorType = Infer<typeof colorValueSchema>
export type ChoiceType = Infer<typeof choiceValueSchema>
export type BooleanType = Infer<typeof booleanValueSchema>
export type ArticleType = Infer<typeof articleValueSchema>
export type ListType = Infer<typeof listValueSchema>
