import { yellow } from 'ansicolor'
import 'dotenv/config'
import { createPubSub } from 'graphql-yoga'
import { Container } from 'inversify'
import { Kysely } from 'kysely'
import { tryCatch } from 'ramda'
import 'reflect-metadata'
import type { PubSub } from 'type-graphql'
import type { DB } from './database/schema.ts'
import { AuthChecker } from './middleware/auth-checker.ts'
import { LogAccess } from './middleware/log-access.ts'
import { ApiKeyResolver } from './resolvers/api-key-resolver.ts'
import { IoResolver } from './resolvers/io-resolver.ts'
import { ListResolver } from './resolvers/list-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { NodeSettingsResolver } from './resolvers/node-settings-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { UserResolver } from './resolvers/user-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'
import { db } from './services/database.ts'
import { ImageService } from './services/image-service.ts'
import { InternalServer } from './services/interal-server.ts'
import { NodeSettingsService } from './services/node-settings-service.ts'
import { ProjectService } from './services/project-service.ts'
import { PublicServer } from './services/public-server.ts'
import { PublicService } from './services/public-service.ts'
import { S3Client } from './services/s3-client.ts'
import { SchemaContext } from './services/schema-context.ts'

import { useAdapter } from '@type-cacheable/node-cache-adapter'
import NodeCache from 'node-cache'
import { Authenticator } from './auth.ts'
import { SesClient } from './services/ses-client.ts'

const client = new NodeCache()
useAdapter(client)

const pubSub = createPubSub()
const container = new Container()
container.bind<PubSub>('PubSub').toConstantValue(pubSub)
container.bind(Kysely<DB>).toConstantValue(db)
container.bind(S3Client).toSelf()
container.bind(SesClient).toSelf()
container.bind(NodeResolver).toSelf()
container.bind(NodeSettingsResolver).toSelf()
container.bind(ListResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(Authenticator).toSelf()
container.bind(ApiKeyResolver).toSelf()
container.bind(UserResolver).toSelf()
container.bind(LogAccess).toSelf()
container.bind(ProjectService).toSelf()
container.bind(IoResolver).toSelf()
container.bind(AuthChecker).toSelf()
container.bind(PublicService).toSelf()
container.bind(SchemaContext).toSelf()
container.bind(ImageService).to(ImageService).inSingletonScope()
container.bind(NodeSettingsService).to(NodeSettingsService).inSingletonScope()
container.bind(InternalServer).to(InternalServer).inSingletonScope()
container.bind(PublicServer).to(PublicServer).inSingletonScope()
container.bind(ValueResolver).toSelf()

console.log(yellow(`Starting services...`))
void container.get(ImageService).init()
void container.get(NodeSettingsService).init()
void container.get(InternalServer).start(container)
void container.get(PublicServer).start()

const shutDown = tryCatch(() => {
	void container.get(PublicServer).stop()
	void container.get(InternalServer).stop()
}, console.error)

process.on('SIGTERM', () => {
	void shutDown()
	process.exit(0) // Exit the process gracefully
})

// You can add other signals if needed
process.on('SIGINT', () => {
	void shutDown()
	// Perform any cleanup tasks here
	process.exit(0) // Exit the process gracefully
})
