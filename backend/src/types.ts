import type { createPubSub } from 'graphql-yoga'
export type PubSub = ReturnType<typeof createPubSub>

import type { User } from 'better-auth'
import type { TreeOf } from 'matchblade'
import type { Node } from './resolvers/node-resolver.ts'

export type LoggedInUser = User

export { NodeType } from '@shared/node-types.ts'

export { Role } from '@shared/project-roles.ts'

export interface Context {
	requestId: string
	user: LoggedInUser
	project_id: ProjectId
	session_id: string
	roles: string[]
	authorize: (roles: readonly string[]) => Promise<boolean>
	authenticate: () => Promise<boolean>
}

export enum Topic {
	UserRegistered = 'userRegistered',
	NodesUpdated = 'nodesUpdated',
	ValuesUpdated = 'valuesUpdated',
	ValueDeleted = 'valueDeleted',
	NodeSettingsUpdated = 'nodeSettingsUpdated',
	SomeNodeSettingsUpdated = 'someNodeSettingsUpdated',
	ApiKeysUpdated = 'apiKeysUpdated',
	UsersUpdated = 'usersUpdated'
}

export type ProjectId = number

export type TreeNode = TreeOf<Node, 'nodes'>

export type ListPath = number[]
