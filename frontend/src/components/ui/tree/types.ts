import { EditorType } from '@shared/enums'
import { type TypeOf, nativeEnum, number, object, record, string } from 'zod'

export const ZodFormField = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional(),
	span: number().optional(),
	autofill: string().optional()
})

export type ZodFormField = TypeOf<typeof ZodFormField>

export const ZodFormSelectField = ZodFormField.merge(
	object({
		options: record(string(), string())
	})
)

export type ZodFormSelectField = TypeOf<typeof ZodFormSelectField>
