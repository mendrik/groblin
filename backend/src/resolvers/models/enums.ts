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
