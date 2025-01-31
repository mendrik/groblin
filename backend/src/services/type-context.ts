import { listToTree } from '@shared/utils/list-to-tree.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import type { GraphQLOutputType } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { Maybe, MaybeAsync } from 'purify-ts'
import { prop, propOr } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { ListResolver } from 'src/resolvers/list-resolver.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import { type Value, ValueResolver } from 'src/resolvers/value-resolver.ts'
import type { ListPath, ProjectId, TreeNode } from 'src/types.ts'

type NodeGraphQLType = {
	type: GraphQLOutputType
	node: TreeNode
}

@injectable()
export class TypeContext {
	@inject(Kysely<DB>)
	private db: Kysely<DB>

	@inject(NodeSettingsResolver)
	private nodeSettingsResolver: NodeSettingsResolver

	@inject(ValueResolver)
	private valueResolver: ValueResolver

	@inject(ListResolver)
	private listResolver: ListResolver

	projectId: ProjectId
	_settings: Map<number, NodeSettings>

	async init(projectId: ProjectId) {
		this.projectId = projectId
		this._settings = await this.nodeSettingsResolver
			.settings(projectId)
			.then(mapBy(prop('node_id')))
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
	getValue(node: TreeNode, path: ListPath): Promise<JsonValue> {
		const fetch = () =>
			this.db
				.selectFrom('values')
				.where('node_id', '=', node.id)
				.select('values.value')
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
				.then(Maybe.fromNullable)
		return MaybeAsync.fromPromise(fetch)
			.map(({ value }) => value)
			.orDefault(null)
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
}
