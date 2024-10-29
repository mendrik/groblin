import { NodeType } from '@shared/enums.ts'
import { registerEnumType } from 'type-graphql'

registerEnumType(NodeType, {
	name: 'NodeType'
})
