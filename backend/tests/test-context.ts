import 'dotenv/config'
import 'reflect-metadata'

import { readFileSync, writeFileSync } from 'node:fs'

import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Pool } from 'pg'

import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import { generate } from '@graphql-codegen/cli'
import { mockClient } from 'aws-sdk-client-mock'
import { printSchema } from 'graphql'
import { createPubSub, createYoga } from 'graphql-yoga'
import { Container } from 'inversify'
import { Kysely, PostgresDialect } from 'kysely'
import type { PubSub } from 'type-graphql'

import type { DB } from 'src/database/schema.ts'
import { ListResolver } from 'src/resolvers/list-resolver.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import { NodeSettingsResolver } from 'src/resolvers/node-settings-resolver.ts'
import { ProjectResolver } from 'src/resolvers/project-resolver.ts'
import { UserResolver } from 'src/resolvers/user-resolver.ts'
import { ImageService } from 'src/services/image-service.ts'
import { S3Client } from 'src/services/s3-client.ts'
import { SchemaContext } from 'src/services/schema-context.ts'
import { SchemaService } from 'src/services/schema-service.ts'
import config from 'tests/codegen.ts'
import { error, log } from '@shared/errors.ts'

const testDb = await new PostgreSqlContainer('postgres:latest')
	.withUsername('groblin')
	.start()

const pool = new Pool({ connectionString: testDb.getConnectionUri() })

const runSqlFile = (file: string) => {
	const sql = readFileSync(file, 'utf8')
	return pool.query(sql).catch(log`Failed to run sql file ${file}: ${error}`)
}

// Load and execute initial SQL data
await runSqlFile('./database/init.sql')
await runSqlFile('./database/test-data.sql')

const container = new Container()
const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool }) })
container.bind(Kysely<DB>).toConstantValue(db)
container.bind<PubSub>('PubSub').toConstantValue(createPubSub())
container.bind(NodeResolver).toSelf()
container.bind(NodeSettingsResolver).toSelf()
container.bind(ListResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(UserResolver).toSelf()
container.bind(SchemaContext).toSelf()
container.bind(SchemaService).toSelf()
container.bind(ImageService).toSelf()
container.bind(AwsS3).toConstantValue(mockClient(AwsS3) as any)
container.bind(S3Client).toSelf()
const schema = await container.get(SchemaService).getSchema(1)
writeFileSync('./tests/test-schema.graphql', printSchema(schema), {
	encoding: 'utf-8'
})
await generate(config)
const yoga = createYoga({ schema })

export { container, pool, testDb, yoga }
