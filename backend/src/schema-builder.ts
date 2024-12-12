import 'dotenv/config'
import { type NonEmptyArray, buildSchema } from 'type-graphql'
import { container } from './injections.ts'
import { AuthChecker } from './middleware/auth-checker.ts'
import { LoggingPubSub } from './pubsub.ts'
import { AuthResolver } from './resolvers/auth-resolver.ts'
import { IoResolver } from './resolvers/io-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { NodeSettingsResolver } from './resolvers/node-settings-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'

const resolvers: NonEmptyArray<Function> = [
	AuthResolver,
	ProjectResolver,
	NodeResolver,
	NodeSettingsResolver,
	ValueResolver,
	IoResolver
]

export const schema = await buildSchema({
	resolvers,
	pubSub: container.get(LoggingPubSub),
	authChecker: AuthChecker,
	container,
	authMode: 'null'
})
