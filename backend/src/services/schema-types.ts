import {
	choiceSettingsSchema,
	mediaSettingsSchema
} from '@shared/node-settings.ts'
import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from 'graphql'
import type { Node, NodeSettings } from '../gql/schema.ts'
import { NodeType } from '../types.ts'

/** The same type definitions serve validation and public query execution. */
export class SchemaTypes {
	private enums = new Map<number, GraphQLEnumType>()
	private media = new Map<number, GraphQLObjectType>()
	readonly thumbnails = new Map<number, string[]>()
	constructor(nodes: Node[], settings: NodeSettings[]) {
		const byNode = new Map(settings.map(row => [row.node_id, row.settings]))
		for (const node of nodes) {
			if (node.type === NodeType.choice) {
				const { choices } = choiceSettingsSchema.parse(
					byNode.get(node.id) ?? {}
				)
				if (choices.length)
					this.enums.set(
						node.id,
						new GraphQLEnumType({
							name: node.name,
							values: Object.fromEntries(
								choices.map(choice => [choice, { value: choice }])
							)
						})
					)
			}
			if (node.type === NodeType.media) {
				const { thumbnails } = mediaSettingsSchema.parse(
					byNode.get(node.id) ?? {}
				)
				this.thumbnails.set(node.id, thumbnails)
				this.media.set(
					node.id,
					new GraphQLObjectType({
						name: `Media_${node.name}`,
						fields: {
							url: { type: GraphQLString },
							contentType: { type: GraphQLString },
							...Object.fromEntries(
								thumbnails.map(size => [`url_${size}`, { type: GraphQLString }])
							)
						}
					})
				)
			}
		}
	}
	getEnumType(id: number) {
		return this.enums.get(id) ?? GraphQLString
	}
	getEnums() {
		return [...this.enums.values()]
	}
	getMediaType(node: Node) {
		const type = this.media.get(node.id)
		if (!type) throw new Error('Media type not found')
		return type
	}
}
