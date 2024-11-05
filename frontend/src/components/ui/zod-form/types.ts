import { EditorType } from '@shared/enums'
import { type TypeOf, array, nativeEnum, number, object, string } from 'zod'

export const FieldMeta = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional(),
	span: number().optional(),
	autofill: string().optional()
})

export const FieldSelectMeta = FieldMeta.extend({
	options: array(object({ id: number(), name: string() }))
})

export type FieldMeta = TypeOf<typeof FieldMeta>
export type FieldSelectMeta = TypeOf<typeof FieldSelectMeta>
