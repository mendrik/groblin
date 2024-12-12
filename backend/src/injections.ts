import 'reflect-metadata'
import 'reflect-metadata'
import { Container } from 'inversify'
import { Kysely } from 'kysely'
import { db } from './database.ts'
import type { DB } from './database/schema.ts'
import { EmailService } from './emails/email-service.ts'
import { AuthChecker } from './middleware/auth-checker.ts'
import { LogAccess } from './middleware/log-access.ts'
import { LoggingPubSub } from './pubsub.ts'
import { AuthResolver } from './resolvers/auth-resolver.ts'
import { IoResolver } from './resolvers/io-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { NodeSettingsResolver } from './resolvers/node-settings-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'
import { ProjectService } from './services/project-service.ts'
import { S3Client } from './services/s3-client.ts'

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
container.bind(LoggingPubSub).toConstructor(LoggingPubSub)
container.bind(EmailService).toSelf()
container.bind(Kysely<DB>).toConstantValue(db)
export { container }
