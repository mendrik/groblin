import { afterEach, expect, test, vi } from 'vitest'
import { container, db } from '../../tests/resolver-context.ts'
import { readContentSnapshot } from './content-revisions.ts'
import { HistoryRetention } from './history-retention.ts'

afterEach(() => vi.unstubAllEnvs())
test('retention bounds history while keeping the current draft, publication and unexpired media links', async () => {
	vi.stubEnv('HISTORY_LIMIT', '10')
	vi.stubEnv('PUBLICATION_LIMIT', '1')
	vi.stubEnv('HISTORY_DAYS', '30')
	const snapshot = await readContentSnapshot(db, 1)
	const old = new Date(Date.now() - 40 * 86400000)
	const rows = await db
		.insertInto('content_revision')
		.values(
			Array.from({ length: 15 }, (_, version) => ({
				project_id: 1,
				version,
				snapshot,
				author_name: 'Test',
				summary: 'Test',
				created_at: version === 1 ? new Date() : old
			}))
		)
		.returning(['id', 'version'])
		.execute()
	const published = rows.find(row => row.version === 0)
	if (!published) throw new Error('Missing revision')
	await db
		.updateTable('project')
		.set({ version: 14, published_revision_id: published.id })
		.where('id', '=', 1)
		.execute()
	await db
		.insertInto('content_publication')
		.values({
			project_id: 1,
			revision_id: published.id,
			author_name: 'Test',
			created_at: old
		})
		.execute()
	await container.get(HistoryRetention).pruneProject(1)
	expect(
		(
			await db
				.selectFrom('content_revision')
				.select('version')
				.where('project_id', '=', 1)
				.orderBy('version')
				.execute()
		).map(row => row.version)
	).toEqual([0, 1, 14])
})
