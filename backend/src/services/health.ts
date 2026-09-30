import { S3Client as AwsS3, HeadBucketCommand } from '@aws-sdk/client-s3'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB } from '../database/schema.ts'
import { migrationFiles } from './migrations.ts'

@injectable()
export class Health {
	@inject(Kysely) private db: Kysely<DB>
	@inject(AwsS3) private s3: AwsS3
	private draining = false
	drain() {
		this.draining = true
	}
	async ready() {
		if (this.draining) return false
		try {
			const files = await migrationFiles()
			const rows = await this.db
				.selectFrom('schema_migration')
				.select(['version', 'checksum'])
				.execute()
			if (
				rows.length !== files.length ||
				files.some(
					file =>
						!rows.some(
							row =>
								row.version === file.version && row.checksum === file.checksum
						)
				)
			)
				return false
			await sql`select 1`.execute(this.db)
			await this.s3.send(
				new HeadBucketCommand({ Bucket: process.env.AWS_BUCKET })
			)
			return !this.draining
		} catch {
			return false
		}
	}
}
