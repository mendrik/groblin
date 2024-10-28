import { Field, ID, Int, ObjectType } from 'type-graphql'
import { EditorType, NodeType } from './enums'

@ObjectType()
export class Node {
	@Field(type => ID)
	id: number

	@Field(type => String)
	name: string

	@Field(type => Int)
	order: number

	@Field(type => [Node], { defaultValue: [] })
	nodes: Node[]

	@Field(type => NodeType)
	type: NodeType

	@Field(type => EditorType)
	editor: EditorType

	@Field(type => Node, { nullable: true })
	parent: Node
}
