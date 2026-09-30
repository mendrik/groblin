import {
	type ContentSnapshot,
	contentSnapshotSchema
} from '@shared/content-snapshot.ts'
import { GraphQLError } from 'graphql'
import { type Kysely, sql } from 'kysely'
import type { DB } from '../database/schema.ts'
import type { Context } from '../types.ts'

type RevisionAuthor = {
	project_id: number
	user: Pick<Context['user'], 'id' | 'name'>
}

export const requireRevision = (
	expected: number,
	current: number,
	entity: string
) => {
	if (!Number.isInteger(expected) || expected < 0)
		throw new GraphQLError('Invalid edit version', {
			extensions: { code: 'BAD_USER_INPUT' }
		})
	if (expected !== current)
		throw new GraphQLError(
			`${entity} changed since you opened it. Review the latest version before saving.`,
			{
				extensions: {
					code: 'CONFLICT',
					expectedRevision: expected,
					currentRevision: current
				}
			}
		)
}

export async function readContentSnapshot(
	db: Kysely<DB>,
	projectId: number
): Promise<ContentSnapshot> {
	const project = await db
		.selectFrom('project')
		.select(['id', 'name', 'version'])
		.where('id', '=', projectId)
		.executeTakeFirstOrThrow()
	const nodes = await db
		.selectFrom('node')
		.selectAll()
		.where('project_id', '=', projectId)
		.orderBy('id')
		.execute()
	const settings = await db
		.selectFrom('node_settings')
		.selectAll()
		.where('project_id', '=', projectId)
		.orderBy('id')
		.execute()
	const values = await db
		.selectFrom('values')
		.selectAll()
		.where('project_id', '=', projectId)
		.orderBy('id')
		.execute()
	return contentSnapshotSchema.parse({
		formatVersion: 1,
		project,
		nodes,
		settings,
		values: values.map(value => ({
			...value,
			updated_at: value.updated_at.toISOString()
		}))
	})
}

/** Call under the project lock, before the first write, to preserve migrated projects too. */
export async function ensureContentBaseline(
	db: Kysely<DB>,
	ctx: RevisionAuthor
) {
	const existing = await db
		.selectFrom('content_revision')
		.select('id')
		.where('project_id', '=', ctx.project_id)
		.limit(1)
		.executeTakeFirst()
	if (existing) return
	const snapshot = await readContentSnapshot(db, ctx.project_id)
	await db
		.insertInto('content_revision')
		.values({
			project_id: ctx.project_id,
			version: snapshot.project.version,
			snapshot,
			author_id: ctx.user.id,
			author_name: ctx.user.name,
			summary: 'Initial content'
		})
		.execute()
}

/** Capture every accepted content mutation in the same transaction as the write. */
export async function recordContentRevision(
	db: Kysely<DB>,
	ctx: RevisionAuthor,
	summary: string
) {
	const { version } = await db
		.updateTable('project')
		.where('id', '=', ctx.project_id)
		.set({
			version: sql`greatest(version + 1,
			coalesce((select max(revision) from node where project_id = ${ctx.project_id}), 0),
			coalesce((select max(revision) from node_settings where project_id = ${ctx.project_id}), 0),
			coalesce((select max(revision) from "values" where project_id = ${ctx.project_id}), 0))`
		})
		.returning('version')
		.executeTakeFirstOrThrow()
	const snapshot = await readContentSnapshot(db, ctx.project_id)
	await db
		.insertInto('content_revision')
		.values({
			project_id: ctx.project_id,
			version,
			snapshot,
			author_id: ctx.user.id,
			author_name: ctx.user.name,
			summary: summary.slice(0, 200)
		})
		.execute()
	return version
}

export async function mediaIsRetained(
	db: Kysely<DB>,
	projectId: number,
	file: string
) {
	const live = await db
		.selectFrom('values')
		.select('id')
		.where('project_id', '=', projectId)
		.where(
			sql<boolean>`(value ->> 'file' = ${file} OR value -> 'assets' ? ${file})`
		)
		.limit(1)
		.executeTakeFirst()
	if (live) return true
	const archived = await db
		.selectFrom('content_revision')
		.select('id')
		.where('project_id', '=', projectId)
		.where(
			sql<boolean>`(snapshot @> ${JSON.stringify({ values: [{ value: { file } }] })}::jsonb OR snapshot @> ${JSON.stringify({ values: [{ value: { assets: [file] } }] })}::jsonb)`
		)
		.limit(1)
		.executeTakeFirst()
	return archived !== undefined
}
