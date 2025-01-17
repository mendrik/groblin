import 'dotenv/config'
import { type NonEmptyArray, PubSub, buildSchema } from 'type-graphql'
import { container } from './injections.ts'
import { AuthChecker } from './middleware/auth-checker.ts'
import { AuthResolver } from './resolvers/auth-resolver.ts'
import { IoResolver } from './resolvers/io-resolver.ts'
import { NodeResolver } from './resolvers/node-resolver.ts'
import { NodeSettingsResolver } from './resolvers/node-settings-resolver.ts'
import { ProjectResolver } from './resolvers/project-resolver.ts'
import { ValueResolver } from './resolvers/value-resolver.ts'
import { ListResolver } from './resolvers/list-resolver.ts'
import { ApiKeyResolver } from './resolvers/api-key-resolver.ts'
import { UserResolver } from './resolvers/user-resolver.ts'

export const schema = await buildSchema({
	resolvers: [
		AuthResolver,
		ProjectResolver,
		NodeResolver,
		NodeSettingsResolver,
		ValueResolver,
		IoResolver,
		ListResolver,
		ApiKeyResolver,
		UserResolver,
	],
	pubSub: container.get<PubSub>('PubSub'),
	authChecker: AuthChecker,
	container,
	emitSchemaFile: '../schema.graphql',
	authMode: 'null'
})
