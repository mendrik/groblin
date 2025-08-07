import { EditorType } from '@shared/enums'
import {
	type TypeOf,
	any,
	array,
	nativeEnum,
	number,
	object,
	string,
	tuple
} from 'zod/v4'

export const FieldMeta = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional(),
	span: number().optional(),
	autofill: string().optional(),
	extra: any().optional(),
	options: array(tuple([string(), string()])).optional(),
})

export const FieldSelectMeta = FieldMeta.extend({
	options: array(any())
})

export type FieldMeta = TypeOf<typeof FieldMeta>
export type FieldSelectMeta = TypeOf<typeof FieldSelectMeta>
