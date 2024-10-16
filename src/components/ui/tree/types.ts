import { type TypeOf, any, nativeEnum, object, string } from 'zod'

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
	defaultValue: any().optional(),
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType)
})

export type ZodFormField = TypeOf<typeof ZodFormField>
