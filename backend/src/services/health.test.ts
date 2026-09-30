import { S3Client as AwsS3, HeadBucketCommand } from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import { Container } from 'inversify'
import { expect, test } from 'vitest'
import { container, db } from '../../tests/resolver-context.ts'
import { Health } from './health.ts'
import { migrationFiles } from './migrations.ts'

test('readiness checks migration checksums and bucket access and turns unavailable while draining', async () => {
	const aws = new AwsS3({ region: 'us-east-1' })
	const mock = mockClient(aws)
	mock.on(HeadBucketCommand).resolves({})
	const child = new Container({ parent: container })
	child.bind(AwsS3).toConstantValue(aws)
	child.bind(Health).toSelf()
	const health = child.get(Health)
	try {
		expect(await health.ready()).toBe(false)
		const files = await migrationFiles()
		await db
			.insertInto('schema_migration')
			.values(
				files.map(({ version, name, checksum }) => ({
					version,
					name,
					checksum
				}))
			)
			.execute()
		expect(await health.ready()).toBe(true)
		mock.on(HeadBucketCommand).rejects(new Error('Unavailable'))
		expect(await health.ready()).toBe(false)
		mock.on(HeadBucketCommand).resolves({})
		health.drain()
		expect(await health.ready()).toBe(false)
	} finally {
		mock.restore()
		aws.destroy()
	}
})
