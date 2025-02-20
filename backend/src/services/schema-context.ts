import { listToTree } from '@shared/utils/list-to-tree.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import { GraphQLEnumType, GraphQLString } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { Maybe } from 'purify-ts'
import { assoc, prop, propOr } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { ListResolver } from 'src/resolvers/list-resolver.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import {
	type ListPath,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import { ImageService } from './image-service.ts'
import { MediaType } from '@shared/json-value-types.ts'

@injectable()
export class SchemaContext {
	@inject(Kysely<DB>)
	private db: Kysely<DB>

	@inject(NodeSettingsResolver)
	private nodeSettingsResolver: NodeSettingsResolver

	@inject(ImageService)
	private imageService: ImageService

	projectId: ProjectId
	_settings: Map<number, NodeSettings>
	_enums: Map<number, GraphQLEnumType>

	async init(projectId: ProjectId) {
		this.projectId = projectId
		this._settings = await this.nodeSettingsResolver
			.settings(projectId)
			.then(mapBy(prop('node_id')))
		this._enums = await this.initEnums()
	}

	async listItems(nodeId: number, path?: ListPath): Promise<Value[]> {
		return this.db
			.selectFrom('values')
			.selectAll()
			.where('node_id', '=', nodeId)
			.$if(isNilOrEmpty(path), qb =>
				qb.where(eb =>
					eb.or([
						eb('list_path', 'is', null),
						eb('list_path', '=', sql.val([]))
					])
				)
			)
			.$if(isNotNilOrEmpty(path), qb =>
				qb.where('list_path', '=', sql.val(path))
			)
			.orderBy('order', 'asc')
			.execute()
	}
	getValue(node: TreeNode, path: ListPath): Promise<Value | undefined> {
		return this.db
			.selectFrom('values')
			.where('node_id', '=', node.id)
			.selectAll()
			.$if(isNilOrEmpty(path), qb =>
				qb.where(eb =>
					eb.or([
						eb('list_path', 'is', null),
						eb('list_path', '=', sql.val([]))
					])
				)
			)
			.$if(isNotNilOrEmpty(path), qb =>
				qb.where('list_path', '=', sql.val(path))
			)
			.executeTakeFirst()
	}

	settings(nodeId: number): Maybe<JsonValue> {
		return Maybe.fromNullable(this._settings.get(nodeId)).map(prop('settings'))
	}

	isRequired(nodeId: number) {
		return this.settings(nodeId)
			.map(propOr(false, 'required'))
			.map(Boolean)
			.orDefault(false)
	}

	/**
	 * Returns a list of nodes that are either objects or lists
	 */
	async getRoot(): Promise<TreeNode> {
		const nodes = await this.db
			.selectFrom('node')
			.where('project_id', '=', this.projectId)
			.selectAll()
			.orderBy('order', 'desc')
			.execute()
		return listToTree('id', 'parent_id', 'nodes')(nodes) as TreeNode
	}

	getEnumType(nodeId: number): GraphQLEnumType | typeof GraphQLString {
		return this._enums.get(nodeId) ?? GraphQLString
	}

	getEnums(): GraphQLEnumType[] {
		return Array.from(this._enums.values())
	}

	async initEnums() {
		const enums = await this.db
			.selectFrom('node_settings')
			.innerJoin('node', 'node.id', 'node_settings.node_id')
			.where('node_settings.project_id', '=', this.projectId)
			.where('node.type', '=', NodeType.choice)
			.select([
				'name',
				'node_id',
				sql<string[]>`ARRAY(
					SELECT jsonb_array_elements_text("node_settings"."settings"->'choices')
				)`.as('choices')
			])
			.execute()

		return enums
			.filter(({ choices }) => choices.length > 0)
			.reduce((acc, { node_id, choices, name }) => {
				acc.set(
					node_id,
					new GraphQLEnumType({
						name,
						values: choices.reduce(
							(acc, choice) => assoc(choice, { value: choice }, acc),
							{}
						)
					})
				)
				return acc
			}, new Map<number, GraphQLEnumType>())
	}

	imageUrl(value: Value & { value: MediaType }, size?: string): string {
		return this.imageService.imageUrl(value, size)
	}
}
