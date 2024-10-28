import { registerEnumType } from 'type-graphql'

export enum NodeType {
	object = 'Object',
	string = 'String',
	number = 'Number',
	boolean = 'Boolean',
	list = 'List',
	date = 'Date',
	schema = 'Schema'
}

registerEnumType(NodeType, {
	name: 'NodeType'
})

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

registerEnumType(EditorType, {
	name: 'EditorType'
})
