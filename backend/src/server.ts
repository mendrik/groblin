import 'dotenv/config'
import 'reflect-metadata'
import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import { createPubSub } from 'graphql-yoga'
import { Container } from 'inversify'
import { Kysely } from 'kysely'
import { Authenticator } from './auth.ts'
import { loadConfig } from './config.ts'
import type { DB } from './database/schema.ts'
import { ApiKeyResolver } from './resolvers/api-key-resolver.ts'
import { IoResolver } from './resolvers/io-resolver.ts'
import { ListResolver } from './resolvers/list-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { NodeSettingsResolver } from './resolvers/node-settings-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { UserResolver } from './resolvers/user-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'
import { db } from './services/database.ts'
import { Health } from './services/health.ts'
import { HistoryRetention } from './services/history-retention.ts'
import { ImageService } from './services/image-service.ts'
import { InternalServer } from './services/interal-server.ts'
import { MediaAssets } from './services/media-assets.ts'
import { MediaCleanup } from './services/media-cleanup.ts'
import { ProjectArchiveService } from './services/project-archive.ts'
import { ProjectService } from './services/project-service.ts'
import { PublicServer } from './services/public-server.ts'
import { S3Client } from './services/s3-client.ts'
import { SchemaContext } from './services/schema-context.ts'
import { SchemaService } from './services/schema-service.ts'
import { SesClient } from './services/ses-client.ts'
import type { PubSub } from './types.ts'
import { log } from './utils/log.ts'

const config = loadConfig(process.env)
// Normalize defaults before services consume the validated configuration.
for (const [key, value] of Object.entries(config))
	if (value !== undefined)
		process.env[key] = Array.isArray(value) ? value.join(',') : String(value)
const s3Options = {
	region: config.AWS_REGION,
	forcePathStyle: config.S3_FORCE_PATH_STYLE === 'true',
	requestHandler: { connectionTimeout: 5000, requestTimeout: 15000 },
	maxAttempts: 2
}
const s3 = new AwsS3({ ...s3Options, endpoint: config.S3_ENDPOINT })
const signing = new AwsS3({
	...s3Options,
	requestChecksumCalculation: 'WHEN_REQUIRED',
	endpoint: config.S3_PUBLIC_ENDPOINT ?? config.S3_ENDPOINT
})
const container = new Container()
container.bind<PubSub>('PubSub').toConstantValue(createPubSub())
container.bind(Kysely<DB>).toConstantValue(db)
container.bind(AwsS3).toConstantValue(s3)
container.bind<AwsS3>('S3SigningClient').toConstantValue(signing)
container.bind(S3Client).toSelf()
container.bind(SesClient).toSelf().inSingletonScope()
container.bind(Authenticator).toSelf().inSingletonScope()
container.bind(NodeResolver).toSelf()
container.bind(NodeSettingsResolver).toSelf()
container.bind(ListResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(ApiKeyResolver).toSelf()
container.bind(UserResolver).toSelf()
container.bind(ProjectService).toSelf()
container.bind(ProjectArchiveService).toSelf()
container.bind(MediaAssets).toSelf()
container.bind(IoResolver).toSelf()
container.bind(SchemaService).toSelf()
container.bind(SchemaContext).toSelf()
container.bind(ImageService).toSelf().inSingletonScope()
container.bind(HistoryRetention).toSelf()
container.bind(MediaCleanup).toSelf().inSingletonScope()
container.bind(Health).toSelf().inSingletonScope()
container.bind(InternalServer).toSelf().inSingletonScope()
container.bind(PublicServer).toSelf().inSingletonScope()
container.bind(ValueResolver).toSelf()

let stopping: Promise<void> | undefined
const shutdown = () => {
	if (stopping) return stopping
	stopping = (async () => {
		log('shutdown_started')
		container.get(Health).drain()
		const timeout = setTimeout(() => {
			log('shutdown_timeout')
			process.exit(1)
		}, config.SHUTDOWN_TIMEOUT_MS)
		timeout.unref()
		try {
			await Promise.all([
				container.get(PublicServer).stop(),
				container.get(InternalServer).stop(),
				container.get(MediaCleanup).stop()
			])
			await db.destroy()
			s3.destroy()
			signing.destroy()
			container.get(SesClient).destroy()
			log('shutdown_complete')
		} finally {
			clearTimeout(timeout)
		}
	})()
	return stopping
}
for (const signal of ['SIGTERM', 'SIGINT'])
	process.on(signal, () => {
		void shutdown().catch(() => {
			log('shutdown_failed')
			process.exitCode = 1
		})
	})
try {
	if (!(await container.get(Health).ready()))
		throw new Error('Database migrations or storage are not ready')
	await container.get(InternalServer).start(container)
	await container.get(PublicServer).start()
	container.get(MediaCleanup).start()
	log('services_ready', { version: '0.1.0' })
} catch (error) {
	log('startup_failed', {
		message: error instanceof Error ? error.message : 'Startup failed'
	})
	process.exitCode = 1
	await shutdown()
}

export { container }
