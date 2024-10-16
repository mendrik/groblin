import { type TypeOf, nativeEnum, object, string } from 'zod'

export enum NodeType {
	object = 'object',
	string = 'string',
	number = 'number',
	boolean = 'boolean',
	list = 'list',
	date = 'date'
}

export enum EditorType {
	select = 'select',
	radios = 'radios',
	multiselect = 'multiselect',
	input = 'input',
	switch = 'switch',
	textarea = 'textarea',
	richtext = 'richtext'
}

export const ZodFormField = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional()
})

export type ZodFormField = TypeOf<typeof ZodFormField>
