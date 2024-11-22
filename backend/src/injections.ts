import 'reflect-metadata'
import { Container } from 'inversify'
import { LogAccess } from './middleware/log-access.ts'
import { AuthResolver } from './resolvers/auth-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'
import { ProjectService } from './services/project-service.ts'

const container = new Container()
container.bind(NodeResolver).toSelf()
container.bind(ValueResolver).toSelf()
container.bind(AuthResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(LogAccess).toSelf()
container.bind(ProjectService).toSelf()

export { container }
