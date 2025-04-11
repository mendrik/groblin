import { Pool } from 'pg'
import { inject } from 'vitest'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'

import { mockClient } from 'aws-sdk-client-mock'
import { S3Client } from '../src/services/s3-client.ts'
import 'dotenv/config'
import { createPubSub, createYoga } from 'graphql-yoga'
import { Container } from 'inversify'
import { Kysely, PostgresDialect } from 'kysely'
import 'reflect-metadata'
import type { PubSub } from 'type-graphql'
import type { DB } from '../src/database/schema.ts'

import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import { Authenticator } from '../src/auth.ts'
import { ApiKeyResolver } from '../src/resolvers/api-key-resolver.ts'
import { IoResolver } from '../src/resolvers/io-resolver.ts'
import { ListResolver } from '../src/resolvers/list-resolver.ts'
import { NodeResolver } from '../src/resolvers/node-resolver.ts'
import { NodeSettingsResolver } from '../src/resolvers/node-settings-resolver.ts'
import { ProjectResolver } from '../src/resolvers/project-resolver.ts'
import { UserResolver } from '../src/resolvers/user-resolver.ts'
import { ImageService } from '../src/services/image-service.ts'
import { ProjectService } from '../src/services/project-service.ts'
import { SchemaContext } from '../src/services/schema-context.ts'
import { SchemaService } from '../src/services/schema-service.ts'
import { SesClient } from '../src/services/ses-client.ts'

process.on('unhandledRejection', (reason: string, p: Promise<any>) => {
	console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

const pool = new Pool({
	host: inject('dbHost'),
	port: inject('dbPort'),
	user: 'groblin',
	password: 'groblin',
	database: 'groblin',
	max: 10
})

const container = new Container()

const pubSub = createPubSub()
const dialect = new PostgresDialect({ pool })
const db = new Kysely<DB>({ dialect })
const s3 = mockClient(AwsS3)

container.bind<PubSub>('PubSub').toConstantValue(pubSub)
container.bind(Kysely<DB>).toConstantValue(db)
container.bind(AwsS3).toConstantValue(s3 as any)
container.bind(S3Client).toSelf()
container.bind(SesClient).toSelf()
container.bind(Authenticator).toSelf()
container.bind(NodeResolver).toSelf()
container.bind(NodeSettingsResolver).toSelf()
container.bind(ListResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(ApiKeyResolver).toSelf()
container.bind(UserResolver).toSelf()
container.bind(ProjectService).toSelf()
container.bind(IoResolver).toSelf()
container.bind(SchemaContext).toSelf()
container.bind(SchemaService).toSelf()
container.bind(ImageService).to(ImageService).inSingletonScope()

declare module 'vitest' {
	export interface TestContext {
		pool: Pool
		container: Container
		query: (query: string) => Promise<Response>
	}
}

const schema = await container.get(SchemaService).getSchema(1)
const yoga = createYoga({ schema })

const query = async (query: string) => {
	const res = await yoga.fetch('/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	})
	if (!res.ok) {
		throw new Error(
			`Error: ${res.status} ${res.statusText} ${await res.text()}`
		)
	}
	return res.json()
}

export const withDatabase = createTaskCollector((name, fn, timeout) =>
	getCurrentSuite().task(name, {
		...(this as any), // so "todo"/"skip"/... is tracked correctly
		meta: {
			transaction: true
		},
		handler: async () => {
			await pool.query('BEGIN')
			const res = await fn({ pool, container, query })
			await pool.query('ROLLBACK')
			return res
		},
		timeout
	})
)
