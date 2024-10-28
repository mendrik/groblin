import { Field, ID, ObjectType } from 'type-graphql'
import { EditorType, NodeType } from './enums'

@ObjectType()
export class Node {
	@Field(type => ID)
	id: string

	@Field(type => String)
	name: string

	@Field(type => [Node], { defaultValue: [] })
	nodes: Node[]

	@Field(type => NodeType)
	type: NodeType

	@Field(type => EditorType)
	editor: EditorType
}
