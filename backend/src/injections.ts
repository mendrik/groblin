import 'reflect-metadata'
import { Container } from 'inversify'
import { LogAccess } from './middleware/log-access.ts'
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
export { container }
