import { assertExists } from '@shared/asserts.ts'
import { listToTree } from '@shared/utils/list-to-tree.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from 'graphql'
import { inject, injectable } from 'inversify'
import {
	type ExpressionBuilder,
	Kysely,
	type OperandExpression,
	type SelectQueryBuilder,
	type SqlBool,
	sql
} from 'kysely'
import {} from 'node_modules/kysely/dist/esm/parser/order-by-parser.js'
import { Maybe } from 'purify-ts'
import { assoc, isNil, isNotEmpty, isNotNil, prop, propOr } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
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
import { isJsonObject } from 'src/utils/json.ts'
import { dbOperator, dbType } from 'src/utils/mappings.ts'
import { allNodes, isValueNode } from 'src/utils/nodes.ts'
import { ImageService, type MediaValue } from './image-service.ts'

export type Filter = {
	[key: string]: any
}

export type ListArgs = {
	allMatch: Filter[]
	anyMatch: Filter[]
	limit?: number
	offset?: number
	order?: {
		node_id: number
		json_field: string
	}
	direction?: 'asc' | 'desc'
}
type Key = string
type Val = any
type Operand = 'eq' | 'ne' | 'lt' | 'gt' | 'lte' | 'gte'
type Operation = [Key, Operand, Val]

const splitFilter = (f: Filter) =>
	Object.entries(f).map(
		([k, v]) =>
			`${k}${k.includes('_') ? '' : '_eq'}`.split('_').concat(v) as Operation
	)

const clause = (
	allChildNodes: TreeNode[],
	filter: Filter,
	eb: ExpressionBuilder<DB, 'values'>
): OperandExpression<SqlBool>[] =>
	Object.entries(filter).map(([key, value]) => {
		const [nodeName, operator = 'eq'] = key.split('_')
		const node = allChildNodes.find(({ name }) => name === nodeName)
		assertExists(node, `Node ${nodeName} not found`)
		const jsonField = dbType(node)
		console.log(`${nodeName}:`, jsonField, dbOperator(operator, value), value)

		return eb(
			sql`child.value->>${sql.val(jsonField)}`,
			sql.raw(dbOperator(operator, value)),
			sql.val(value)
		) as OperandExpression<SqlBool>
	})

const allMatchClause =
	(path: ListPath, allChildNodes: TreeNode[], { allMatch }: ListArgs) =>
	<T extends SelectQueryBuilder<DB, 'values', any>>(qb: T) => {
		allMatch.flatMap(splitFilter).map(([key, operand, value]) => {
			console.log(`all: ${key} ${operand} ${value}`)
			const node = allChildNodes.find(n => n.name === key)
			assertExists(node, `Node ${key} not found`)

			qb.leftJoin(`values as all_${key}_${operand}`, join =>
				join
					.on(`all_${key}_${operand}.node_id`, '=', node.id)
					.on(
						sql`all_${key}.list_path @> array_append(${sql.val(path)}, "values"."id")`
					)
			)
			qb.where(eb =>
				eb(
					`"all_${key}_${operand}"."value"->${dbType(node)}` as any,
					dbOperator(operand, value) as any,
					sql.val(value)
				)
			)
		})
		return qb
	}

const specificOrder =
	(path: ListPath, { order, direction }: ListArgs) =>
	<T extends SelectQueryBuilder<DB, 'values', any>>(qb: T) =>
		qb
			.leftJoin('values as v_order', join =>
				join
					.on('v_order.node_id', '=', order!.node_id)
					.on(
						sql`v_order.list_path @> array_append(${sql.val(path)}, "values"."id")`
					)
			)
			.orderBy(
				sql`v_order.value->>${sql.val(order!.json_field)}`,
				direction ?? 'asc'
			)

@injectable()
export class SchemaContext {
	@inject(Kysely<DB>)
	private db: Kysely<DB>

	@inject(NodeSettingsResolver)
	private nodeSettingsResolver: NodeSettingsResolver

	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	@inject(ImageService)
	private imageService: ImageService

	projectId: ProjectId
	_settings: Map<number, NodeSettings>
	_enums: Map<number, GraphQLEnumType>
	_thumbnails: Map<number, string[]>

	async init(projectId: ProjectId) {
		this.projectId = projectId
		this._settings = await this.nodeSettingsResolver
			.settings(projectId)
			.then(mapBy(prop('node_id')))
		this._enums = await this.initEnums()
		this._thumbnails = await this.initThumbnails()
	}

	async initThumbnails(): Promise<Map<number, string[]>> {
		const thumbnails = await this.db
			.selectFrom('node_settings')
			.leftJoin('node', 'node.id', 'node_settings.node_id')
			.where('node_settings.project_id', '=', this.projectId)
			.where('type', '=', NodeType.media)
			.select(['node_id', 'settings'])
			.execute()

		return thumbnails.reduce((acc, { node_id, settings }) => {
			if (isJsonObject(settings) && Array.isArray(settings.thumbnails)) {
				acc.set(node_id, settings.thumbnails as string[])
			}
			return acc
		}, new Map<number, string[]>())
	}

	async listItems(
		nodeId: number,
		path: ListPath,
		listArgs: ListArgs
	): Promise<Value[]> {
		const {
			direction,
			limit,
			offset,
			order,
			allMatch = [],
			anyMatch = []
		} = listArgs
		const node = await this.nodeResolver.getTreeNode(this.projectId, nodeId)
		const allChildNodes = [...allNodes(node)].filter(isValueNode)

		return this.db
			.selectFrom('values')
			.selectAll('values')
			.$if(isNotNil(order), specificOrder(path, listArgs))
			.$if(isNotEmpty(allMatch), allMatchClause(path, allChildNodes, listArgs))
			.where('values.node_id', '=', nodeId)
			.$if(isNilOrEmpty(path), qb =>
				qb.where(eb =>
					eb.or([
						eb('values.list_path', 'is', null),
						eb('values.list_path', '=', sql.val([]))
					])
				)
			)
			.$if(isNotNilOrEmpty(path), qb =>
				qb.where('values.list_path', '=', sql.val(path))
			)
			.$if(isNotNil(offset), qb => qb.offset(offset ?? 0))
			.$if(isNotNil(limit), qb => qb.limit(limit ?? Number.MAX_SAFE_INTEGER))
			.$if(isNil(order), qb => qb.orderBy('values.order', direction ?? 'asc'))
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

	getMediaType(node: TreeNode): GraphQLObjectType {
		const thumbnails = this._thumbnails.get(node.id) ?? []
		const fields = {
			url: { type: GraphQLString },
			contentType: { type: GraphQLString },
			...thumbnails.reduce(
				(acc, size) => ({
					...acc,
					[`url_${size}`]: { type: GraphQLString }
				}),
				{}
			)
		}
		return new GraphQLObjectType({
			name: `Media_${node.name}`,
			fields
		})
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

	mediaUrl(value: MediaValue, size?: string): string {
		return this.imageService.mediaUrl(value, size)
	}

	getMedia(media: MediaValue) {
		const sizes = this._thumbnails.get(media.node_id) ?? []
		const thumbnails = sizes.reduce(
			(acc, size) =>
				assoc(`url_${size}`, this.imageService.mediaUrl(media, size), acc),
			{}
		)
		return {
			url: this.imageService.mediaUrl(media),
			contentType: media.value.contentType,
			...thumbnails
		}
	}
}
