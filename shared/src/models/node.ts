import { Field, ID, ObjectType } from 'type-graphql'
import { EditorType, NodeType } from './enums'

@ObjectType()
class Node {
	@Field(type => ID)
	id: string

	@Field()
	name: string

	@Field(type => [Node], { defaultValue: [] })
	nodes: Node[]

	@Field(type => NodeType)
	type: NodeType

	@Field(type => EditorType)
	editor: EditorType
}
