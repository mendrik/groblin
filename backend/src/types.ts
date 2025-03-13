import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import type { User } from 'better-auth'
import type { Node } from './resolvers/node-resolver.ts'

export type LoggedInUser = User

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
	media = 'Media'

	// reference = 'Reference'
	// tags = "Tags"
}

export enum Role {
	Admin = 'Admin',
	Viewer = 'Viewer'
}

export interface Context {
	requestId: number
	user: LoggedInUser
	project_id: ProjectId
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
