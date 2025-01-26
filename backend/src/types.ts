import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import type { LoggedInUser } from './resolvers/auth-resolver.ts'
import type { Node } from './resolvers/node-resolver.ts'

export enum NodeType {
	root = 'Root',
	object = 'Object',
	string = 'String',
	article = 'Article',
	number = 'Number',
	boolean = 'Boolean',
	list = 'List',
	choice = 'Choice',
	date = 'Date',
	color = 'Color',
	media = 'Media',
	reference = 'Reference'
}

export enum Role {
	Admin = 'Admin',
	Viewer = 'Viewer'
}

export interface Context {
	requestId: number
	user: Required<LoggedInUser>
}

export enum Topic {
	UserRegistered = 'userRegistered',
	NodesUpdated = 'nodesUpdated',
	ValuesUpdated = 'valuesUpdated',
	ValueReplaced = 'valueReplaced',
	NodeSettingsUpdated = 'nodeSettingsUpdated',
	ApiKeysUpdated = 'apiKeysUpdated',
	UsersUpdated = 'usersUpdated'
}

export type ProjectId = number

export type TreeNode = TreeOf<Node, 'nodes'>

export type ListPath = number[]
