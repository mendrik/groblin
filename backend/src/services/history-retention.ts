import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB } from '../database/schema.ts'
import { lockProject } from './model-validation.ts'

@injectable()
export class HistoryRetention {
	@inject(Kysely) private db: Kysely<DB>
	private cursor = 0
	async processPending() {
		const projects = await this.db
			.selectFrom('project')
			.select('id')
			.where('id', '>', this.cursor)
			.orderBy('id')
			.limit(25)
			.execute()
		for (const project of projects) {
			await this.pruneProject(project.id)
			this.cursor = project.id
		}
		if (projects.length < 25) this.cursor = 0
	}
	async pruneProject(projectId: number) {
		const days = Number(process.env.HISTORY_DAYS ?? 30)
		const limit = Number(process.env.HISTORY_LIMIT ?? 1000)
		const publications = Number(process.env.PUBLICATION_LIMIT ?? 100)
		await this.db.transaction().execute(async trx => {
			await lockProject(trx, projectId)
			// Every issued media URL remains usable for its one hour lifetime.
			await sql`DELETE FROM content_publication WHERE id IN (
				SELECT id FROM (SELECT id, created_at, row_number() OVER (ORDER BY id DESC) AS position FROM content_publication WHERE project_id=${projectId}) AS history
				WHERE created_at < now() - interval '1 hour' AND (position > ${publications} OR created_at < now() - ${days} * interval '1 day')
				AND id <> COALESCE((SELECT max(id) FROM content_publication WHERE project_id=${projectId}), 0)
				LIMIT 1000
			)`.execute(trx)
			await sql`DELETE FROM content_revision WHERE id IN (
				SELECT history.id FROM (SELECT id, version, created_at, row_number() OVER (ORDER BY version DESC) AS position FROM content_revision WHERE project_id=${projectId}) AS history
				JOIN project ON project.id=${projectId}
				WHERE history.created_at < now() - interval '1 hour'
				AND (position > ${limit} OR history.created_at < now() - ${days} * interval '1 day')
				AND history.version <> project.version
				AND history.id <> COALESCE(project.published_revision_id, 0)
				AND NOT EXISTS (SELECT 1 FROM content_publication WHERE revision_id=history.id AND project_id=${projectId})
				LIMIT 1000
			)`.execute(trx)
		})
	}
}
