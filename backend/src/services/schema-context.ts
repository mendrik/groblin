import { assertExists } from '@shared/asserts.ts'
import { listToTree } from '@shared/utils/list-to-tree.ts'
import { mapBy } from '@shared/utils/map-by.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import type { AnyFn } from '@tp/functions.ts'
import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from 'graphql'
import { inject, injectable } from 'inversify'
import {
	type Expression,
	type ExpressionBuilder,
	type ExpressionWrapper,
	Kysely,
	type SelectQueryBuilder,
	type SqlBool,
	type TableExpression,
	sql
} from 'kysely'
import { Maybe } from 'purify-ts'
import {
	T as _,
	assoc,
	chain,
	head,
	isNil,
	isNotEmpty,
	isNotNil,
	keys,
	map,
	pipe,
	prop,
	propOr,
	split,
	uniq
} from 'ramda'
import { compact, isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
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
import {
	type Operand,
	arrow,
	dbValue,
	jsonField,
	opMap
} from 'src/utils/mappings.ts'
import { allNodes } from 'src/utils/nodes.ts'
import { ImageService, type MediaValue } from './image-service.ts'

export type Filter = {
	[key: string]: any
}

export type ListArgs = {
	filter: Filter[]
	name?: string
	limit?: number
	offset?: number
	order?: {
		node_id: number
		json_field: string
	}
	direction?: 'asc' | 'desc'
}
type Key = string

const extractKeys = chain<Filter, string>(
	pipe(keys, map(pipe(split('_'), head))) as AnyFn
)

const customSort =
	(path: ListPath, { order }: ListArgs) =>
	(qb: SelectQueryBuilder<any, any, any>) => {
		const o = sql`order_v.value->${sql.lit(order!.json_field)}`
		console.log(order!.json_field)

		return qb
			.leftJoin('values as order_v', j =>
				j
					.on(
						'order_v.list_path',
						'@>',
						sql`array_append(${sql.val(path)}, "values"."id")`
					)
					.on('order_v.node_id', '=', sql.val(order!.node_id))
			)
			.select([o.as('field_order')])
	}

type Condition = {
	join: {
		table: TableExpression<DB, keyof DB>
		on: Expression<SqlBool>
	}
	condition: (
		eb: ExpressionBuilder<DB, keyof DB>
	) => ExpressionWrapper<DB, keyof DB, any>
}

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
		const { direction, limit, offset, order, name, filter = [] } = listArgs
		const node = await this.nodeResolver.getTreeNode(this.projectId, nodeId)
		const children = [...allNodes(node)]
		const orderNodeKey = children.find(n => n.id === order?.node_id)?.name
		const allKeys = pipe(compact, uniq)([...extractKeys(filter), orderNodeKey])
		const filterNodes = [...allNodes(node)].filter(node =>
			allKeys.includes(node.name)
		)
		const res = this.db
			.selectFrom('values')
			.select([
				'values.id',
				'values.node_id',
				'values.value',
				'values.list_path',
				'values.order'
			])
			.distinctOn(['values.id', 'values.order'])
			.where('values.node_id', '=', nodeId)
			.$if(isNotNil(name), q =>
				q.where(eb => eb(sql`"values"."value"->>'name'`, '=', sql.val(name)))
			)
			.$if(isNotEmpty(filter), q => {
				const processFilterEntry =
					(index: number) =>
					([key, val]: [string, any]): Condition => {
						const [prop, op = 'eq'] = key.split('_') as [Key, Operand]
						const join = `${prop}_${index}`
						const node = filterNodes.find(n => n.name === prop)
						assertExists(node, `Node not found for property: ${prop}`)
						const field = sql`${sql.ref(`${join}.value`)}${sql.raw(arrow(node, val))}${sql.lit(jsonField(node))}`

						const condition = (eb: ExpressionBuilder<any, any>) =>
							match<[Operand, any], any>(
								caseOf(['eq', isNil], () => eb(field, 'is', null)),
								caseOf(['not', isNil], () => eb(field, 'is not', null)),
								caseOf([_, _], () =>
									eb(field, sql.raw(opMap[op]), dbValue(op, node, val))
								)
							)

						return {
							join: {
								table: `values as ${join}`,
								on: sql`${sql.ref(`${join}.list_path`)} @> array_append(${sql.val(path)}, "values"."id")`
							},
							condition: (eb: ExpressionBuilder<any, any>) =>
								condition(eb)(op, val)
						}
					}

				const conditions = filter.map((f, index) =>
					Object.entries(f).map(processFilterEntry(index))
				)

				const q2 = conditions.reduce(
					(q, group) =>
						group.reduce(
							(q, { join }) =>
								q.innerJoin(join.table, j =>
									j.on(join.on)
								) as SelectQueryBuilder<DB, 'values', Value>,
							q
						),
					q
				)
				return q2.where(eb =>
					eb.or(
						conditions.map(group =>
							eb.and(group.map(({ condition }) => condition(eb)))
						)
					)
				)
			})
			.$if(isNotNil(order), customSort(path, listArgs))
			.orderBy('values.id')
			.orderBy('values.order', direction ?? 'asc')
			.$if(isNotNil(offset), q => q.offset(offset ?? 0))
			.$if(isNotNil(limit), q => q.limit(limit ?? Number.MAX_SAFE_INTEGER))

		const query = isNil(order)
			? res
			: this.db
					.selectFrom(res.as('sub'))
					.selectAll()
					.orderBy('sub.field_order', direction ?? 'asc')

		const data = await query.execute()
		// console.log(data)
		return data as Value[]
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
