import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from '../database/schema.ts'
import { HistoryRetention } from './history-retention.ts'
import { MediaAssets } from './media-assets.ts'
import { S3Client } from './s3-client.ts'

@injectable()
export class MediaCleanup {
	@inject(MediaAssets) private assets: MediaAssets
	@inject(HistoryRetention) private history: HistoryRetention
	@inject(Kysely)
	private db: Kysely<DB>
	@inject(S3Client)
	private storage: S3Client
	private timer: ReturnType<typeof setInterval> | undefined
	private running: Promise<void> | undefined

	async processPending() {
		for (let processed = 0; processed < 25; processed++) {
			const found = await this.db.transaction().execute(async trx => {
				const job = await trx
					.selectFrom('media_cleanup_job')
					.selectAll()
					.where('not_before', '<=', new Date())
					.orderBy('id')
					.forUpdate()
					.skipLocked()
					.executeTakeFirst()
				if (!job) return false
				try {
					const projectId = Number(
						job.prefix.match(/^project_([1-9][0-9]*)\/$/)?.[1]
					)
					if (!Number.isSafeInteger(projectId))
						throw new Error('Invalid cleanup project')
					const project = await trx
						.selectFrom('project')
						.select('id')
						.where('id', '=', projectId)
						.executeTakeFirst()
					if (project) throw new Error('Project still exists; cleanup refused')
					await this.storage.deleteProjectPrefix(job.prefix)
					await trx
						.deleteFrom('media_cleanup_job')
						.where('id', '=', job.id)
						.execute()
				} catch (error) {
					await trx
						.updateTable('media_cleanup_job')
						.set({
							attempts: job.attempts + 1,
							not_before: new Date(
								Date.now() +
									Math.min(3600000, 60000 * 2 ** Math.min(job.attempts, 6))
							),
							last_error:
								error instanceof Error
									? error.message.slice(0, 500)
									: 'Storage cleanup failed'
						})
						.where('id', '=', job.id)
						.execute()
				}
				return true
			})
			if (!found) break
		}

		await this.history.processPending()
		await this.assets.expire()
	}

	start() {
		const tick = () => {
			if (this.running) return
			this.running = this.processPending()
				.catch(error => console.error('Media cleanup failed', error))
				.finally(() => {
					this.running = undefined
				})
		}
		tick()
		this.timer = setInterval(tick, 60000)
		this.timer.unref()
	}

	async stop() {
		clearInterval(this.timer)
		await this.running
	}
}
