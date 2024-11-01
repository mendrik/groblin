import 'dotenv/config'
import { Container } from 'inversify'
import { type NonEmptyArray, buildSchema } from 'type-graphql'
import { authChecker } from './middleware/auth-checker.ts'
import { LogAccess } from './middleware/log-access.ts'
import { pubSub } from './pubsub.ts'
import {
	AuthResolver,
	NodeResolver,
	ProjectResolver
} from './resolvers/index.ts'

const container = new Container()
container.bind(NodeResolver).toSelf()
container.bind(AuthResolver).toSelf()
container.bind(ProjectResolver).toSelf()
container.bind(LogAccess).toSelf()

const resolvers: NonEmptyArray<Function> = [
	AuthResolver,
	ProjectResolver,
	NodeResolver
]

export const schema = await buildSchema({
	resolvers,
	pubSub,
	authChecker,
	container
})
