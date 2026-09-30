import { writeFile } from 'node:fs/promises'
import { printSchema } from 'graphql'
import { MediaAssets } from '../src/services/media-assets.ts'
import 'reflect-metadata'
import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { createPubSub, createYoga } from 'graphql-yoga'
import { Container } from 'inversify'
import { Kysely } from 'kysely'
import { Pool, type PoolClient } from 'pg'
import { Authenticator } from '../src/auth.ts'
import type { DB } from '../src/database/schema.ts'
import { NodeResolver } from '../src/resolvers/node-resolver.ts'
import { NodeSettingsResolver } from '../src/resolvers/node-settings-resolver.ts'
import { ImageService } from '../src/services/image-service.ts'
import { S3Client } from '../src/services/s3-client.ts'
import { SchemaContext } from '../src/services/schema-context.ts'
import { SchemaService } from '../src/services/schema-service.ts'
import { createRollbackDatabase } from './rollback-database.ts'

export const startDatabase = () =>
	new PostgreSqlContainer('postgres:17-alpine')
		.withUsername('groblin')
		.withCopyFilesToContainer([
			{
				source: './database/init.sql',
				target: '/docker-entrypoint-initdb.d/01-schema.sql'
			},
			{
				source: './tests/fixtures.sql',
				target: '/docker-entrypoint-initdb.d/02-fixtures.sql'
			}
		])
		.start()

export async function createTestContext(client: PoolClient) {
	// Every Kysely query uses the same checked-out connection as BEGIN/ROLLBACK.
	const db = createRollbackDatabase(client)
	const container = new Container()
	container.bind(Kysely<DB>).toConstantValue(db)
	container.bind('PubSub').toConstantValue(createPubSub())
	container.bind(NodeResolver).toSelf()
	container.bind(NodeSettingsResolver).toSelf()
	container.bind(SchemaContext).toSelf()
	container.bind(SchemaService).toSelf()
	container.bind(ImageService).toSelf()
	container.bind(MediaAssets).toSelf()
	container.bind(AwsS3).toConstantValue(new AwsS3({ region: 'eu-north-1' }))
	container.bind(S3Client).toSelf()
	container.bind(Authenticator).toConstantValue({
		api: { getSession: async () => null }
	} as unknown as Authenticator)
	const schema = await container.get(SchemaService).getSchema(1)
	if (process.env.UPDATE_TEST_SCHEMA === '1')
		await writeFile('./tests/test-schema.graphql', printSchema(schema))
	return { container, yoga: createYoga({ schema }), db }
}
export { Pool }
