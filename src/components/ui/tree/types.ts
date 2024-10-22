import { type TypeOf, nativeEnum, number, object, string } from 'zod'

export enum NodeType {
	object = 'Object',
	string = 'String',
	number = 'Number',
	boolean = 'Boolean',
	list = 'List',
	date = 'Date',
	schema = 'Schema'
}

export enum EditorType {
	select = 'select',
	radios = 'radios',
	multiselect = 'multiselect',
	input = 'input',
	password = 'password',
	email = 'email',
	switch = 'switch',
	textarea = 'textarea',
	richtext = 'richtext'
}

export const ZodFormField = object({
	label: string(),
	description: string().optional(),
	editor: nativeEnum(EditorType),
	placeholder: string().optional(),
	span: number().optional(),
	autofill: string().optional()
})

export type ZodFormField = TypeOf<typeof ZodFormField>
