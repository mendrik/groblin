import { listToTree } from '@shared/utils/list-to-tree.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import type { GraphQLType } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { Maybe, MaybeAsync } from 'purify-ts'
import { isNotNil, prop, propOr } from 'ramda'
import type { DB, JsonObject } from 'src/database/schema.ts'
import { type ListRequest, ListResolver } from 'src/resolvers/list-resolver.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import { ValueResolver } from 'src/resolvers/value-resolver.ts'
import {
	type ListPath,
	NodeType,
	type ProjectId,
	type TreeNode
} from 'src/types.ts'
import { allNodes } from 'src/utils/nodes.ts'

type NodeGraphQLType = {
	type: GraphQLType
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

	types: Map<number, NodeGraphQLType>
	projectId: ProjectId
	_settings: Map<number, NodeSettings>

	constructor() {
		this.types = new Map()
	}

	async listItems(req: ListRequest) {
		return this.listResolver.listItems(this.projectId, req)
	}
	getValue<T extends JsonObject = JsonObject>(
		node: TreeNode,
		path: ListPath
	): MaybeAsync<T> {
		const fetch = () =>
			this.db
				.selectFrom('values')
				.where('node_id', '=', node.id)
				.select('values.value')
				.executeTakeFirst()
				.then(Maybe.fromNullable)
		return MaybeAsync.fromPromise(fetch).map(({ value }) => value as T)
	}

	async settings(nodeId: number) {
		if (this._settings === undefined) {
			this._settings = await this.nodeSettingsResolver
				.settings(this.projectId)
				.then(mapBy(prop('node_id')))
		}
		return Maybe.fromNullable(this._settings.get(nodeId)).map(prop('settings'))
	}

	async isRequired(nodeId: number) {
		return MaybeAsync.fromPromise(() => this.settings(nodeId))
			.map(propOr(false, 'required'))
			.map(Boolean)
			.orDefault(false)
	}

	/**
	 * Returns a list of nodes that are either objects or lists
	 */
	async getNestingNodes(): Promise<TreeNode[]> {
		const nodeTypeIds = await this.db
			.selectFrom('node')
			.select('id')
			.where('project_id', '=', this.projectId)
			.where(eb =>
				eb.or([
					eb('type', '=', NodeType.object),
					eb('type', '=', NodeType.list)
				])
			)
			.orderBy('depth', 'desc')
			.orderBy('order', 'desc')
			.execute()
		const nodes = await this.db
			.selectFrom('node')
			.where('project_id', '=', this.projectId)
			.selectAll()
			.orderBy('order', 'desc')
			.execute()
		const root = listToTree('id', 'parent_id', 'nodes')(nodes) as TreeNode
		const treeNodes = [...allNodes(root)]
		const nodeMap = mapBy(prop('id'), treeNodes)
		return nodeTypeIds.map(({ id }) => nodeMap.get(id)).filter(isNotNil)
	}
}
