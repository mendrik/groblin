import { EditorType } from '@shared/enums'
import { type TypeOf, any, map, nativeEnum, number, object, string } from 'zod'

export const FieldMeta = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional(),
	span: number().optional(),
	autofill: string().optional()
})

export const FieldSelectMeta = FieldMeta.extend({
	options: map(any(), string())
})

export type FieldMeta = TypeOf<typeof FieldMeta>
export type FieldSelectMeta = TypeOf<typeof FieldSelectMeta>
