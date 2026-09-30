import { assertExists } from '@shared/asserts.ts'
import {
	type ContentSnapshot,
	contentSnapshotSchema
} from '@shared/content-snapshot.ts'
import { inject, injectable } from 'inversify'
import {
	type Expression,
	type ExpressionBuilder,
	type ExpressionWrapper,
	Kysely,
	type Selectable,
	type SelectQueryBuilder,
	type SqlBool,
	sql,
	type TableExpression
} from 'kysely'
import { caseOf, listToTree, mapBy, match } from 'matchblade'
import { Maybe } from 'purify-ts'
import { T as _, assoc, isNil, isNotEmpty, isNotNil, prop, propOr } from 'ramda'
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import {
	type NodeSettings,
	NodeSettingsResolver
} from 'src/resolvers/node-settings-resolver.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import type { ListPath, ProjectId, TreeNode } from 'src/types.ts'
import {
	arrow,
	dbValue,
	jsonField,
	type Operand,
	onlyMonth,
	onlyYear,
	operators,
	opMap,
	yearAndMonth
} from 'src/utils/mappings.ts'
import { allNodes } from 'src/utils/nodes.ts'
import { parseNode } from '../utils/parse-node.ts'
import { ImageService, type MediaValue } from './image-service.ts'
import { SchemaTypes } from './schema-types.ts'

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
const customSort =
	(path: ListPath, { order }: ListArgs) =>
	(qb: SelectQueryBuilder<any, any, any>) => {
		const o = sql`order_v.value->${sql.lit(order!.json_field)}`

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
	constructor(
		@inject(Kysely) private db: Kysely<DB>,
		@inject(NodeSettingsResolver)
		private nodeSettingsResolver: NodeSettingsResolver,
		@inject(NodeResolver) private nodeResolver: NodeResolver,
		@inject(ImageService) private imageService: ImageService
	) {}

	async forProject(projectId: ProjectId) {
		const context = new SchemaContext(
			this.db,
			this.nodeSettingsResolver,
			this.nodeResolver,
			this.imageService
		)
		await context.init(projectId)
		return context
	}

	projectId: ProjectId
	private snapshot: ContentSnapshot | undefined
	private revisionId: number | undefined
	_settings: Map<number, NodeSettings>
	types: SchemaTypes

	forSnapshot(input: ContentSnapshot, revisionId: number) {
		const snapshot = contentSnapshotSchema.parse(input)
		const context = new SchemaContext(
			this.db,
			this.nodeSettingsResolver,
			this.nodeResolver,
			this.imageService
		)
		context.projectId = snapshot.project.id
		context.snapshot = snapshot
		context.revisionId = revisionId
		context._settings = new Map(
			snapshot.settings.map(row => [
				row.node_id,
				{ ...row, settings: row.settings ?? {} }
			])
		)
		context.types = new SchemaTypes(snapshot.nodes, [
			...context._settings.values()
		])
		return context
	}

	/** PostgreSQL applies identical nested filters and ordering to live and immutable data. */
	private valuesDatabase() {
		const source = this.snapshot
			? sql<
					Selectable<DB['values']>
				>`jsonb_populate_recordset(null::public."values", ${JSON.stringify(this.snapshot.values)}::jsonb)`
			: sql<Selectable<DB['values']>>`public."values"`
		return this.db.with('values', query =>
			query.selectFrom(source.as('saved_value')).selectAll()
		)
	}

	async init(projectId: ProjectId) {
		this.projectId = projectId
		this._settings = await this.nodeSettingsResolver
			.settings(projectId)
			.then(mapBy(prop('node_id')))
		this.types = new SchemaTypes(
			await this.nodeResolver.getDbNodes(projectId),
			[...this._settings.values()]
		)
	}

	async listItems(
		nodeId: number,
		path: ListPath,
		listArgs: ListArgs
	): Promise<Value[]> {
		const { direction, limit, offset, order, name, filter = [] } = listArgs
		const node = this.snapshot
			? [...allNodes(await this.getRoot())].find(node => node.id === nodeId)
			: await this.nodeResolver.getTreeNode(this.projectId, nodeId)
		assertExists(node, 'List field not found')
		const children = [...allNodes(node)]
		const filterFields = new Map(
			children.flatMap(node =>
				operators(node).map(
					op =>
						[
							op === 'eq' ? node.name : `${node.name}_${op}`,
							{ node, op }
						] as const
				)
			)
		)
		const database = this.valuesDatabase()
		const res = database
			.selectFrom('values')
			.select([
				'values.id',
				'values.revision',
				'values.node_id',
				'values.value',
				'values.list_path',
				'values.order',
				'values.updated_at'
			])
			.distinctOn(['values.id', 'values.order'])
			.where('values.node_id', '=', nodeId)
			.where('values.project_id', '=', this.projectId)
			.$if(path.length === 0, q =>
				q.where(eb =>
					eb.or([
						eb('values.list_path', 'is', null),
						eb('values.list_path', '=', sql.val([]))
					])
				)
			)
			.$if(path.length > 0, q =>
				q.where('values.list_path', '=', sql.val(path))
			)
			.$if(isNotNil(name), q =>
				q.where(eb => eb(sql`"values"."value"->>'name'`, '=', sql.val(name)))
			)
			.$if(isNotEmpty(filter), q => {
				const processFilterEntry =
					(index: number) =>
					([key, val]: [string, any]): Condition => {
						const definition = filterFields.get(key)
						assertExists(definition, `Unknown filter: ${key}`)
						const { node, op } = definition
						const join = `filter_${node.id}_${op}_${index}`

						const field = sql`${sql.ref(`${join}.value`)}${sql.raw(arrow(node, val))}${sql.lit(jsonField(node))}`

						const condition = (eb: ExpressionBuilder<any, any>) =>
							match<[TreeNode, Operand, any], any>(
								caseOf([_, 'eq', isNil], () => eb(field, 'is', null)),
								caseOf([_, 'not', isNil], () => eb(field, 'is not', null)),
								onlyYear(eb, field, op),
								yearAndMonth(eb, field, op),
								onlyMonth(eb, field, op),
								caseOf([_, _, _], () =>
									eb(field, sql.raw(opMap[op]), dbValue(op, node, val))
								)
							)

						return {
							join: {
								table: `values as ${join}`,
								on: sql`${sql.ref(`${join}.list_path`)} @> array_append(${sql.val(path)}, "values"."id") and ${sql.ref(`${join}.node_id`)} = ${sql.val(node.id)}`
							},
							condition: (eb: ExpressionBuilder<any, any>) =>
								condition(eb)(node, op, val)
						}
					}

				const conditions = filter.map((f, index) =>
					Object.entries(f).map(processFilterEntry(index))
				)

				const q2 = conditions.reduce(
					(q, group) =>
						group.reduce(
							(q, { join }) =>
								q.leftJoin(join.table, j =>
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
			.orderBy('values.order')

		const query = database
			.selectFrom(res.as('sub'))
			.selectAll()
			.$if(isNotNil(order), q =>
				q.orderBy('sub.field_order', direction ?? 'asc')
			)
			.orderBy('sub.order', direction ?? 'asc')
			.orderBy('sub.id')
			.offset(Math.max(0, offset ?? 0))
			.limit(Math.max(0, Math.min(limit ?? 100, 1000)))

		const data = await query.execute()
		return data as Value[]
	}

	getValue(node: TreeNode, path: ListPath): Promise<Value | undefined> {
		return this.valuesDatabase()
			.selectFrom('values')
			.where('node_id', '=', node.id)
			.where('project_id', '=', this.projectId)
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
		if (this.snapshot)
			return listToTree(
				'id',
				'parent_id',
				'nodes'
			)(
				[...this.snapshot.nodes].sort(
					(a, b) => a.order - b.order || a.id - b.id
				)
			)
		const nodes = await this.db
			.selectFrom('node')
			.where('project_id', '=', this.projectId)
			.selectAll()
			.orderBy('order', 'desc')
			.execute()
		return listToTree('id', 'parent_id', 'nodes')(nodes.map(parseNode))
	}

	articleHtml(content: string) {
		return this.imageService.articleHtml(content, this.revisionId)
	}

	mediaUrl(value: MediaValue, size?: string): string {
		return this.imageService.mediaUrl(value, size, this.revisionId)
	}

	getMedia(media: MediaValue) {
		const sizes = this.types.thumbnails.get(media.node_id) ?? []
		const thumbnails = sizes.reduce(
			(acc, size) =>
				assoc(
					`url_${size}`,
					this.imageService.mediaUrl(media, size, this.revisionId),
					acc
				),
			{}
		)
		return {
			url: this.imageService.mediaUrl(media, undefined, this.revisionId),
			contentType: media.value.contentType,
			...thumbnails
		}
	}
}
