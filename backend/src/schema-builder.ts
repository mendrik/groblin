import 'dotenv/config'
import { type NonEmptyArray, buildSchema } from 'type-graphql'
import { container } from './injections.ts'
import { authChecker } from './middleware/auth-checker.ts'
import { pubSub } from './pubsub.ts'
import { AuthResolver } from './resolvers/auth-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'

const resolvers: NonEmptyArray<Function> = [
	AuthResolver,
	ProjectResolver,
	NodeResolver,
	ValueResolver
]

export const schema = await buildSchema({
	resolvers,
	pubSub,
	authChecker,
	container
})
