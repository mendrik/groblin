import 'reflect-metadata'
import 'reflect-metadata'
import { createPubSub } from 'graphql-yoga'
import { Container } from 'inversify'
import { Kysely } from 'kysely'
import type { PubSub } from 'type-graphql'
import type { DB } from './database/schema.ts'
import { AuthChecker } from './middleware/auth-checker.ts'
import { LogAccess } from './middleware/log-access.ts'
import { AuthResolver } from './resolvers/auth-resolver.ts'
import { IoResolver } from './resolvers/io-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { NodeSettingsResolver } from './resolvers/node-settings-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'
import { db } from './services/database.ts'
import { EmailService } from './services/email-service.ts'
import { ProjectService } from './services/project-service.ts'
import { S3Client } from './services/s3-client.ts'

const pubSub = createPubSub()

const container = new Container()
container.bind(NodeResolver).toSelf()
container.bind(NodeSettingsResolver).toSelf()
container.bind(ValueResolver).toSelf()
container.bind(AuthResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(LogAccess).toSelf()
container.bind(ProjectService).toSelf()
container.bind(IoResolver).toSelf()
container.bind(S3Client).toSelf()
container.bind(AuthChecker).toSelf()
container.bind<PubSub>('PubSub').toConstantValue(pubSub)
container.bind(EmailService).toSelf()
container.bind(Kysely<DB>).toConstantValue(db)
export { container }
