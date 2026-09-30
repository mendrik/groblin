import { contentSnapshotSchema } from '@shared/content-snapshot.ts'
import type { GraphQLSchema } from 'graphql'
import { GraphQLError } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from '../database/schema.ts'
import type { ProjectId } from '../types.ts'
import { validateModelRows } from './model-validation.ts'
import { buildPublicSchema } from './public-schema.ts'
import { SchemaContext } from './schema-context.ts'

@injectable()
export class SchemaService {
	@inject(SchemaContext)
	context: SchemaContext
	@inject(Kysely)
	private db: Kysely<DB>
	async getSchema(projectId: ProjectId): Promise<GraphQLSchema> {
		const context = await this.context.forProject(projectId)
		return buildPublicSchema(await context.getRoot(), context.types, context)
	}
	async getRevisionSchema(projectId: ProjectId, revisionId: number) {
		const row = await this.db
			.selectFrom('content_revision')
			.select('snapshot')
			.where('id', '=', revisionId)
			.where('project_id', '=', projectId)
			.executeTakeFirst()
		if (!row)
			throw new GraphQLError('Content revision not found', {
				extensions: { code: 'NOT_FOUND' }
			})
		const snapshot = contentSnapshotSchema.parse(row.snapshot)
		if (
			snapshot.project.id !== projectId ||
			[...snapshot.nodes, ...snapshot.settings, ...snapshot.values].some(
				row => row.project_id !== projectId
			)
		)
			throw new GraphQLError('Invalid revision project', {
				extensions: { code: 'BAD_USER_INPUT' }
			})
		validateModelRows(snapshot.nodes, snapshot.settings, snapshot.values)
		const context = this.context.forSnapshot(snapshot, revisionId)
		return buildPublicSchema(await context.getRoot(), context.types, context)
	}
}
