import { EditorType } from '@shared/models/enums'
import { type TypeOf, nativeEnum, number, object, string } from 'zod'

export const ZodFormField = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional(),
	span: number().optional(),
	autofill: string().optional()
})

export type ZodFormField = TypeOf<typeof ZodFormField>
