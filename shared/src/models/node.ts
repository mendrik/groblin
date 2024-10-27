import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
class Node {
	@Field(type => ID)
	id: string

	@Field()
	name: string

	@Field(type => Node, { nullable: true })
	parent: Node

	@Field({ nullable: true })
	averageRating?: number
}
