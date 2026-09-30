/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
	| T
	| {
			[P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never
	  }

import type { DocumentNode, ExecutionResult } from 'graphql'
import { gql } from 'graphql-tag'
import type * as Types from './schema'

export * from './schema'
export type GetProjectQueryVariables = Exact<{ [key: string]: never }>

export type GetProjectQuery = {
	getProject: {
		project: { version: number; id: number; name: string }
		nodes: Array<{
			revision: number
			id: number
			name: string
			order: number
			type: Types.NodeType
			depth: number
			parent_id: number | null
		}>
		values: Array<{
			revision: number
			id: number
			node_id: number
			order: number
			value: Record<string, any> | null
			list_path: Array<number> | null
			updated_at: string
		}>
		nodeSettings: Array<{
			revision: number
			id: number
			node_id: number
			settings: Record<string, any>
		}>
	}
}

export type ValueFragment = {
	revision: number
	id: number
	node_id: number
	order: number
	value: Record<string, any> | null
	list_path: Array<number> | null
	updated_at: string
}

export type NodeFragment = {
	revision: number
	id: number
	name: string
	order: number
	type: Types.NodeType
	depth: number
	parent_id: number | null
}

export type NodeSettingsFragment = {
	revision: number
	id: number
	node_id: number
	settings: Record<string, any>
}

export type NodesUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>

export type NodesUpdatedSubscription = { nodesUpdated: boolean }

export type GetNodesQueryVariables = Exact<{ [key: string]: never }>

export type GetNodesQuery = {
	getNodes: Array<{
		revision: number
		id: number
		name: string
		order: number
		type: Types.NodeType
		depth: number
		parent_id: number | null
	}>
}

export type InsertNodeMutationVariables = Exact<{
	data: Types.InsertNode
	settings?: Record<string, any> | null | undefined
}>

export type InsertNodeMutation = { insertNode: { id: number } }

export type UpdateNodeMutationVariables = Exact<{
	data: Types.ChangeNodeInput
}>

export type UpdateNodeMutation = {
	updateNode: {
		revision: number
		id: number
		name: string
		order: number
		type: Types.NodeType
		depth: number
		parent_id: number | null
	}
}

export type DeleteNodeByIdMutationVariables = Exact<{
	order: number
	parent_id: number
	id: number
	expectedImpact: string
}>

export type DeleteNodeByIdMutation = { deleteNodeById: boolean }

export type GetNodeSttingsQueryVariables = Exact<{ [key: string]: never }>

export type GetNodeSttingsQuery = {
	getNodeSettings: Array<{
		revision: number
		id: number
		settings: Record<string, any>
		node_id: number
	}>
}

export type UpsertNodeSettingsMutationVariables = Exact<{
	data: Types.UpsertNodeSettings
}>

export type UpsertNodeSettingsMutation = {
	upsertNodeSettings: {
		revision: number
		id: number
		node_id: number
		settings: Record<string, any>
	}
}

export type NodeSettingsUpdatedSubscriptionVariables = Exact<{
	[key: string]: never
}>

export type NodeSettingsUpdatedSubscription = { nodeSettingsUpdated: boolean }

export type ValuesUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>

export type ValuesUpdatedSubscription = {
	valuesUpdated: {
		revision: number
		id: number
		node_id: number
		order: number
		value: Record<string, any> | null
		list_path: Array<number> | null
		updated_at: string
	} | null
}

export type GetValuesQueryVariables = Exact<{
	data: Types.GetValues
}>

export type GetValuesQuery = {
	getValues: Array<{
		revision: number
		id: number
		node_id: number
		order: number
		value: Record<string, any> | null
		list_path: Array<number> | null
		updated_at: string
	}>
}

export type InsertListItemMutationVariables = Exact<{
	listItem: Types.InsertListItem
}>

export type InsertListItemMutation = { insertListItem: number }

export type DeleteListItemMutationVariables = Exact<{
	id: number
	expectedImpact: string
}>

export type DeleteListItemMutation = { deleteListItem: boolean }

export type UpsertValueMutationVariables = Exact<{
	data: Types.UpsertValue
}>

export type UpsertValueMutation = {
	upsertValue: {
		revision: number
		id: number
		node_id: number
		order: number
		value: Record<string, any> | null
		list_path: Array<number> | null
		updated_at: string
	}
}

export type DeleteValueMutationVariables = Exact<{
	id: number
	expectedImpact: string
}>

export type DeleteValueMutation = { deleteValue: boolean }

export type ImportArrayMutationVariables = Exact<{
	data: Types.JsonArrayImportInput
	expectedVersion: number
	expectedSource: string
}>

export type ImportArrayMutation = { importArray: boolean }

export type ImportObjectMutationVariables = Exact<{
	data: Types.JsonArrayImportInput
	expectedVersion: number
	expectedSource: string
}>

export type ImportObjectMutation = { importObject: boolean }

export type PreviewImportQueryVariables = Exact<{
	data: Types.JsonArrayImportInput
	kind: Types.ImportKind
}>

export type PreviewImportQuery = {
	previewImport: {
		version: number
		source: string
		name: string
		fieldsAdded: number
		valuesAdded: number
		valuesChanged: number
		valuesRemoved: number
	}
}

export type TruncateListMutationVariables = Exact<{
	data: Types.TruncateValue
}>

export type TruncateListMutation = { truncate: boolean }

export type UploadUrlMutationVariables = Exact<{
	data: Types.UploadInput
}>

export type UploadUrlMutation = {
	uploadUrl: { signedUrl: string; object: string }
}

export type GetListItemsQueryVariables = Exact<{
	request: Types.ListRequest
}>

export type GetListItemsQuery = {
	getListItems: Array<{
		revision: number
		id: number
		node_id: number
		value: Record<string, any> | null
		order: number
		list_path: Array<number> | null
		updated_at: string
		children: Array<{
			revision: number
			id: number
			node_id: number
			order: number
			value: Record<string, any> | null
			list_path: Array<number> | null
			updated_at: string
		}>
	}>
}

export type GetListColumnsQueryVariables = Exact<{
	node_id: number
}>

export type GetListColumnsQuery = {
	getListColumns: Array<{
		revision: number
		id: number
		name: string
		order: number
		type: Types.NodeType
		depth: number
		parent_id: number | null
	}>
}

export type ApiKeyFragment = {
	preview: boolean
	name: string
	key: string
	is_active: boolean
	created_at: string
	expires_at: string | null
	last_used: string | null
}

export type GetApiKeysQueryVariables = Exact<{ [key: string]: never }>

export type GetApiKeysQuery = {
	getApiKeys: Array<{
		preview: boolean
		name: string
		key: string
		is_active: boolean
		created_at: string
		expires_at: string | null
		last_used: string | null
	}>
}

export type CreateApiKeyMutationVariables = Exact<{
	data: Types.CreateApiKey
}>

export type CreateApiKeyMutation = {
	createApiKey: {
		preview: boolean
		name: string
		key: string
		is_active: boolean
		created_at: string
		expires_at: string | null
		last_used: string | null
	}
}

export type DeleteApiKeyMutationVariables = Exact<{
	key: string
}>

export type DeleteApiKeyMutation = { deleteApiKey: boolean }

export type ToggleApiKeyMutationVariables = Exact<{
	key: string
}>

export type ToggleApiKeyMutation = { toggleApiKey: boolean }

export type ApiKeysUpdatedSubscriptionVariables = Exact<{
	[key: string]: never
}>

export type ApiKeysUpdatedSubscription = { apiKeysUpdated: boolean }

export type ProjectUserFragment = {
	role: Types.Role
	id: string
	email: string
	name: string
	confirmed: boolean
	roles: Array<string>
	owner: boolean
}

export type GetUsersQueryVariables = Exact<{ [key: string]: never }>

export type GetUsersQuery = {
	getUsers: Array<{
		role: Types.Role
		id: string
		email: string
		name: string
		confirmed: boolean
		roles: Array<string>
		owner: boolean
	}>
}

export type InviteUserMutationVariables = Exact<{
	invite: Types.Invite
}>

export type InviteUserMutation = {
	inviteUser: {
		url: string
		emailSent: boolean
		emailError: string | null
		invitation: {
			id: number
			email: string
			role: Types.Role
			created_at: string
			expires_at: string
			accepted_at: string | null
			revoked_at: string | null
		}
	}
}

export type DeleteUserMutationVariables = Exact<{
	id: string
}>

export type DeleteUserMutation = { deleteUser: boolean }

export type UsersUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>

export type UsersUpdatedSubscription = { usersUpdated: boolean }

export type GetDeletionImpactQueryVariables = Exact<{
	target: Types.DeletionTarget
}>

export type GetDeletionImpactQuery = {
	getDeletionImpact: {
		fingerprint: string
		name: string
		fields: number
		values: number
		listItems: number
		mediaFiles: number
		fieldNames: Array<string>
	}
}

export type GetContentRevisionsQueryVariables = Exact<{
	before?: number | null | undefined
	limit?: number | null | undefined
}>

export type GetContentRevisionsQuery = {
	getContentRevisions: Array<{
		id: number
		version: number
		created_at: string
		author_name: string
		summary: string
	}>
}

export type GetContentRevisionQueryVariables = Exact<{
	id: number
}>

export type GetContentRevisionQuery = {
	getContentRevision: {
		snapshot: Record<string, any>
		revision: {
			id: number
			version: number
			created_at: string
			author_name: string
			summary: string
		}
	}
}

export type RestoreContentRevisionMutationVariables = Exact<{
	id: number
	expectedVersion: number
}>

export type RestoreContentRevisionMutation = { restoreContentRevision: number }

export type ProjectInvitationFragment = {
	id: number
	email: string
	role: Types.Role
	created_at: string
	expires_at: string
	accepted_at: string | null
	revoked_at: string | null
}

export type GetWorkspaceQueryVariables = Exact<{ [key: string]: never }>

export type GetWorkspaceQuery = {
	getWorkspace: {
		projects: Array<{
			id: number
			name: string
			version: number
			role: Types.Role
		}>
		currentProject: {
			id: number
			name: string
			version: number
			role: Types.Role
		} | null
	}
}

export type PublicationFragment = {
	id: number
	revision_id: number
	version: number
	author_name: string
	created_at: string
	summary: string
}

export type GetPublicationQueryVariables = Exact<{ [key: string]: never }>

export type GetPublicationQuery = {
	getPublication: {
		draftVersion: number
		current: {
			id: number
			revision_id: number
			version: number
			author_name: string
			created_at: string
			summary: string
		} | null
		history: Array<{
			id: number
			revision_id: number
			version: number
			author_name: string
			created_at: string
			summary: string
		}>
	}
}

export type PublishContentMutationVariables = Exact<{
	expectedVersion: number
	expectedPublication: number
	revisionId?: number | null | undefined
}>

export type PublishContentMutation = {
	publishContent: {
		id: number
		revision_id: number
		version: number
		author_name: string
		created_at: string
		summary: string
	}
}

export type WorkspaceUpdatedSubscriptionVariables = Exact<{
	[key: string]: never
}>

export type WorkspaceUpdatedSubscription = { workspaceUpdated: boolean }

export type GetInvitationsQueryVariables = Exact<{ [key: string]: never }>

export type GetInvitationsQuery = {
	getInvitations: Array<{
		id: number
		email: string
		role: Types.Role
		created_at: string
		expires_at: string
		accepted_at: string | null
		revoked_at: string | null
	}>
}

export type GetInvitationQueryVariables = Exact<{
	token: string
}>

export type GetInvitationQuery = {
	getInvitation: {
		project_name: string
		email: string
		role: Types.Role
		expires_at: string
		accepted: boolean
	}
}

export type CreateProjectMutationVariables = Exact<{
	name: string
}>

export type CreateProjectMutation = { createProject: number }

export type SwitchProjectMutationVariables = Exact<{
	id: number
}>

export type SwitchProjectMutation = { switchProject: boolean }

export type RenameProjectMutationVariables = Exact<{
	name: string
	expectedVersion: number
}>

export type RenameProjectMutation = { renameProject: number }

export type DeleteProjectMutationVariables = Exact<{
	expectedVersion: number
	confirmation: string
}>

export type DeleteProjectMutation = { deleteProject: boolean }

export type TransferProjectOwnershipMutationVariables = Exact<{
	userId: string
}>

export type TransferProjectOwnershipMutation = {
	transferProjectOwnership: boolean
}

export type UpdateUserRoleMutationVariables = Exact<{
	id: string
	role: Types.Role
	expectedRole: Types.Role
}>

export type UpdateUserRoleMutation = { updateUserRole: boolean }

export type RevokeInvitationMutationVariables = Exact<{
	id: number
}>

export type RevokeInvitationMutation = { revokeInvitation: boolean }

export type AcceptInvitationMutationVariables = Exact<{
	token: string
}>

export type AcceptInvitationMutation = { acceptInvitation: number }

export type ExportProjectMutationVariables = Exact<{ [key: string]: never }>

export type ExportProjectMutation = {
	exportProject: { filename: string; bytes: number; url: string }
}

export type PreviewProjectImportQueryVariables = Exact<{
	key: string
}>

export type PreviewProjectImportQuery = {
	previewProjectImport: {
		source: string
		name: string
		fields: number
		values: number
		mediaFiles: number
		mediaBytes: number
	}
}

export type ImportProjectArchiveMutationVariables = Exact<{
	key: string
	expectedSource: string
	name: string
}>

export type ImportProjectArchiveMutation = { importProjectArchive: number }

export type GetListPageQueryVariables = Exact<{
	request: Types.ListRequest
}>

export type GetListPageQuery = {
	getListPage: {
		total: number
		limit: number
		offset: number
		items: Array<{
			revision: number
			id: number
			node_id: number
			order: number
			value: Record<string, any> | null
			list_path: Array<number> | null
			updated_at: string
			children: Array<{
				revision: number
				id: number
				node_id: number
				order: number
				value: Record<string, any> | null
				list_path: Array<number> | null
				updated_at: string
			}>
		}>
	}
}

export type FinalizeUploadMutationVariables = Exact<{
	key: string
}>

export type FinalizeUploadMutation = {
	finalizeUpload: {
		file: string
		name: string
		contentType: string
		size: number
		width: number | null
		height: number | null
	}
}

export const ValueFragmentDoc = gql`
    fragment Value on Value {
  revision
  id
  node_id
  order
  value
  list_path
  updated_at
}
    `
export const NodeFragmentDoc = gql`
    fragment Node on Node {
  revision
  id
  name
  order
  type
  depth
  parent_id
}
    `
export const NodeSettingsFragmentDoc = gql`
    fragment NodeSettings on NodeSettings {
  revision
  id
  node_id
  settings
}
    `
export const ApiKeyFragmentDoc = gql`
    fragment ApiKey on ApiKey {
  preview
  name
  key
  is_active
  created_at
  expires_at
  last_used
}
    `
export const ProjectUserFragmentDoc = gql`
    fragment ProjectUser on ProjectUser {
  role
  id
  email
  name
  confirmed
  roles
  owner
}
    `
export const ProjectInvitationFragmentDoc = gql`
    fragment ProjectInvitation on ProjectInvitation {
  id
  email
  role
  created_at
  expires_at
  accepted_at
  revoked_at
}
    `
export const PublicationFragmentDoc = gql`
    fragment Publication on Publication {
  id
  revision_id
  version
  author_name
  created_at
  summary
}
    `
export const GetProjectDocument = gql`
    query GetProject {
  getProject {
    project {
      version
      id
      name
    }
    nodes {
      ...Node
    }
    values {
      ...Value
    }
    nodeSettings {
      ...NodeSettings
    }
  }
}
    ${NodeFragmentDoc}
${ValueFragmentDoc}
${NodeSettingsFragmentDoc}`
export const NodesUpdatedDocument = gql`
    subscription NodesUpdated {
  nodesUpdated
}
    `
export const GetNodesDocument = gql`
    query GetNodes {
  getNodes {
    ...Node
  }
}
    ${NodeFragmentDoc}`
export const InsertNodeDocument = gql`
    mutation InsertNode($data: InsertNode!, $settings: JSONObject) {
  insertNode(data: $data, settings: $settings) {
    id
  }
}
    `
export const UpdateNodeDocument = gql`
    mutation UpdateNode($data: ChangeNodeInput!) {
  updateNode(data: $data) {
    ...Node
  }
}
    ${NodeFragmentDoc}`
export const DeleteNodeByIdDocument = gql`
    mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!, $expectedImpact: String!) {
  deleteNodeById(
    order: $order
    parent_id: $parent_id
    id: $id
    expectedImpact: $expectedImpact
  )
}
    `
export const GetNodeSttingsDocument = gql`
    query GetNodeSttings {
  getNodeSettings {
    revision
    id
    settings
    node_id
  }
}
    `
export const UpsertNodeSettingsDocument = gql`
    mutation UpsertNodeSettings($data: UpsertNodeSettings!) {
  upsertNodeSettings(data: $data) {
    ...NodeSettings
  }
}
    ${NodeSettingsFragmentDoc}`
export const NodeSettingsUpdatedDocument = gql`
    subscription NodeSettingsUpdated {
  nodeSettingsUpdated
}
    `
export const ValuesUpdatedDocument = gql`
    subscription ValuesUpdated {
  valuesUpdated {
    ...Value
  }
}
    ${ValueFragmentDoc}`
export const GetValuesDocument = gql`
    query GetValues($data: GetValues!) {
  getValues(data: $data) {
    ...Value
  }
}
    ${ValueFragmentDoc}`
export const InsertListItemDocument = gql`
    mutation InsertListItem($listItem: InsertListItem!) {
  insertListItem(listItem: $listItem)
}
    `
export const DeleteListItemDocument = gql`
    mutation DeleteListItem($id: Int!, $expectedImpact: String!) {
  deleteListItem(id: $id, expectedImpact: $expectedImpact)
}
    `
export const UpsertValueDocument = gql`
    mutation UpsertValue($data: UpsertValue!) {
  upsertValue(data: $data) {
    ...Value
  }
}
    ${ValueFragmentDoc}`
export const DeleteValueDocument = gql`
    mutation DeleteValue($id: Int!, $expectedImpact: String!) {
  deleteValue(id: $id, expectedImpact: $expectedImpact)
}
    `
export const ImportArrayDocument = gql`
    mutation ImportArray($data: JsonArrayImportInput!, $expectedVersion: Int!, $expectedSource: String!) {
  importArray(
    data: $data
    expectedVersion: $expectedVersion
    expectedSource: $expectedSource
  )
}
    `
export const ImportObjectDocument = gql`
    mutation ImportObject($data: JsonArrayImportInput!, $expectedVersion: Int!, $expectedSource: String!) {
  importObject(
    data: $data
    expectedVersion: $expectedVersion
    expectedSource: $expectedSource
  )
}
    `
export const PreviewImportDocument = gql`
    query PreviewImport($data: JsonArrayImportInput!, $kind: ImportKind!) {
  previewImport(data: $data, kind: $kind) {
    version
    source
    name
    fieldsAdded
    valuesAdded
    valuesChanged
    valuesRemoved
  }
}
    `
export const TruncateListDocument = gql`
    mutation TruncateList($data: TruncateValue!) {
  truncate(data: $data)
}
    `
export const UploadUrlDocument = gql`
    mutation UploadUrl($data: UploadInput!) {
  uploadUrl(data: $data) {
    signedUrl
    object
  }
}
    `
export const GetListItemsDocument = gql`
    query GetListItems($request: ListRequest!) {
  getListItems(request: $request) {
    revision
    id
    node_id
    value
    order
    list_path
    updated_at
    children {
      ...Value
    }
  }
}
    ${ValueFragmentDoc}`
export const GetListColumnsDocument = gql`
    query GetListColumns($node_id: Int!) {
  getListColumns(node_id: $node_id) {
    ...Node
  }
}
    ${NodeFragmentDoc}`
export const GetApiKeysDocument = gql`
    query GetApiKeys {
  getApiKeys {
    ...ApiKey
  }
}
    ${ApiKeyFragmentDoc}`
export const CreateApiKeyDocument = gql`
    mutation CreateApiKey($data: CreateApiKey!) {
  createApiKey(data: $data) {
    ...ApiKey
  }
}
    ${ApiKeyFragmentDoc}`
export const DeleteApiKeyDocument = gql`
    mutation DeleteApiKey($key: String!) {
  deleteApiKey(key: $key)
}
    `
export const ToggleApiKeyDocument = gql`
    mutation ToggleApiKey($key: String!) {
  toggleApiKey(key: $key)
}
    `
export const ApiKeysUpdatedDocument = gql`
    subscription ApiKeysUpdated {
  apiKeysUpdated
}
    `
export const GetUsersDocument = gql`
    query GetUsers {
  getUsers {
    ...ProjectUser
  }
}
    ${ProjectUserFragmentDoc}`
export const InviteUserDocument = gql`
    mutation InviteUser($invite: Invite!) {
  inviteUser(data: $invite) {
    invitation {
      ...ProjectInvitation
    }
    url
    emailSent
    emailError
  }
}
    ${ProjectInvitationFragmentDoc}`
export const DeleteUserDocument = gql`
    mutation DeleteUser($id: String!) {
  deleteUser(id: $id)
}
    `
export const UsersUpdatedDocument = gql`
    subscription UsersUpdated {
  usersUpdated
}
    `
export const GetDeletionImpactDocument = gql`
    query GetDeletionImpact($target: DeletionTarget!) {
  getDeletionImpact(target: $target) {
    fingerprint
    name
    fields
    values
    listItems
    mediaFiles
    fieldNames
  }
}
    `
export const GetContentRevisionsDocument = gql`
    query GetContentRevisions($before: Int, $limit: Int) {
  getContentRevisions(before: $before, limit: $limit) {
    id
    version
    created_at
    author_name
    summary
  }
}
    `
export const GetContentRevisionDocument = gql`
    query GetContentRevision($id: Int!) {
  getContentRevision(id: $id) {
    revision {
      id
      version
      created_at
      author_name
      summary
    }
    snapshot
  }
}
    `
export const RestoreContentRevisionDocument = gql`
    mutation RestoreContentRevision($id: Int!, $expectedVersion: Int!) {
  restoreContentRevision(id: $id, expectedVersion: $expectedVersion)
}
    `
export const GetWorkspaceDocument = gql`
    query GetWorkspace {
  getWorkspace {
    projects {
      id
      name
      version
      role
    }
    currentProject {
      id
      name
      version
      role
    }
  }
}
    `
export const GetPublicationDocument = gql`
    query GetPublication {
  getPublication {
    draftVersion
    current {
      ...Publication
    }
    history {
      ...Publication
    }
  }
}
    ${PublicationFragmentDoc}`
export const PublishContentDocument = gql`
    mutation PublishContent($expectedVersion: Int!, $expectedPublication: Int!, $revisionId: Int) {
  publishContent(
    expectedVersion: $expectedVersion
    expectedPublication: $expectedPublication
    revisionId: $revisionId
  ) {
    ...Publication
  }
}
    ${PublicationFragmentDoc}`
export const WorkspaceUpdatedDocument = gql`
    subscription WorkspaceUpdated {
  workspaceUpdated
}
    `
export const GetInvitationsDocument = gql`
    query GetInvitations {
  getInvitations {
    ...ProjectInvitation
  }
}
    ${ProjectInvitationFragmentDoc}`
export const GetInvitationDocument = gql`
    query GetInvitation($token: String!) {
  getInvitation(token: $token) {
    project_name
    email
    role
    expires_at
    accepted
  }
}
    `
export const CreateProjectDocument = gql`
    mutation CreateProject($name: String!) {
  createProject(name: $name)
}
    `
export const SwitchProjectDocument = gql`
    mutation SwitchProject($id: Int!) {
  switchProject(id: $id)
}
    `
export const RenameProjectDocument = gql`
    mutation RenameProject($name: String!, $expectedVersion: Int!) {
  renameProject(name: $name, expectedVersion: $expectedVersion)
}
    `
export const DeleteProjectDocument = gql`
    mutation DeleteProject($expectedVersion: Int!, $confirmation: String!) {
  deleteProject(expectedVersion: $expectedVersion, confirmation: $confirmation)
}
    `
export const TransferProjectOwnershipDocument = gql`
    mutation TransferProjectOwnership($userId: String!) {
  transferProjectOwnership(userId: $userId)
}
    `
export const UpdateUserRoleDocument = gql`
    mutation UpdateUserRole($id: String!, $role: Role!, $expectedRole: Role!) {
  updateUserRole(id: $id, role: $role, expectedRole: $expectedRole)
}
    `
export const RevokeInvitationDocument = gql`
    mutation RevokeInvitation($id: Int!) {
  revokeInvitation(id: $id)
}
    `
export const AcceptInvitationDocument = gql`
    mutation AcceptInvitation($token: String!) {
  acceptInvitation(token: $token)
}
    `
export const ExportProjectDocument = gql`
    mutation ExportProject {
  exportProject {
    filename
    bytes
    url
  }
}
    `
export const PreviewProjectImportDocument = gql`
    query PreviewProjectImport($key: String!) {
  previewProjectImport(key: $key) {
    source
    name
    fields
    values
    mediaFiles
    mediaBytes
  }
}
    `
export const ImportProjectArchiveDocument = gql`
    mutation ImportProjectArchive($key: String!, $expectedSource: String!, $name: String!) {
  importProjectArchive(key: $key, expectedSource: $expectedSource, name: $name)
}
    `
export const GetListPageDocument = gql`
    query GetListPage($request: ListRequest!) {
  getListPage(request: $request) {
    total
    limit
    offset
    items {
      revision
      id
      node_id
      order
      value
      list_path
      updated_at
      children {
        ...Value
      }
    }
  }
}
    ${ValueFragmentDoc}`
export const FinalizeUploadDocument = gql`
    mutation FinalizeUpload($key: String!) {
  finalizeUpload(key: $key) {
    file
    name
    contentType
    size
    width
    height
  }
}
    `
export type Requester<C = {}, E = unknown> = <R, V>(
	doc: DocumentNode,
	vars?: V,
	options?: C
) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
	return {
		GetProject(
			variables?: GetProjectQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetProjectQuery, E>> {
			return requester<GetProjectQuery, GetProjectQueryVariables>(
				GetProjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetProjectQuery, E>>
		},
		NodesUpdated(
			variables?: NodesUpdatedSubscriptionVariables,
			options?: C
		): AsyncIterable<ExecutionResult<NodesUpdatedSubscription, E>> {
			return requester<
				NodesUpdatedSubscription,
				NodesUpdatedSubscriptionVariables
			>(NodesUpdatedDocument, variables, options) as AsyncIterable<
				ExecutionResult<NodesUpdatedSubscription, E>
			>
		},
		GetNodes(
			variables?: GetNodesQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetNodesQuery, E>> {
			return requester<GetNodesQuery, GetNodesQueryVariables>(
				GetNodesDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetNodesQuery, E>>
		},
		InsertNode(
			variables: InsertNodeMutationVariables,
			options?: C
		): Promise<ExecutionResult<InsertNodeMutation, E>> {
			return requester<InsertNodeMutation, InsertNodeMutationVariables>(
				InsertNodeDocument,
				variables,
				options
			) as Promise<ExecutionResult<InsertNodeMutation, E>>
		},
		UpdateNode(
			variables: UpdateNodeMutationVariables,
			options?: C
		): Promise<ExecutionResult<UpdateNodeMutation, E>> {
			return requester<UpdateNodeMutation, UpdateNodeMutationVariables>(
				UpdateNodeDocument,
				variables,
				options
			) as Promise<ExecutionResult<UpdateNodeMutation, E>>
		},
		DeleteNodeById(
			variables: DeleteNodeByIdMutationVariables,
			options?: C
		): Promise<ExecutionResult<DeleteNodeByIdMutation, E>> {
			return requester<DeleteNodeByIdMutation, DeleteNodeByIdMutationVariables>(
				DeleteNodeByIdDocument,
				variables,
				options
			) as Promise<ExecutionResult<DeleteNodeByIdMutation, E>>
		},
		GetNodeSttings(
			variables?: GetNodeSttingsQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetNodeSttingsQuery, E>> {
			return requester<GetNodeSttingsQuery, GetNodeSttingsQueryVariables>(
				GetNodeSttingsDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetNodeSttingsQuery, E>>
		},
		UpsertNodeSettings(
			variables: UpsertNodeSettingsMutationVariables,
			options?: C
		): Promise<ExecutionResult<UpsertNodeSettingsMutation, E>> {
			return requester<
				UpsertNodeSettingsMutation,
				UpsertNodeSettingsMutationVariables
			>(UpsertNodeSettingsDocument, variables, options) as Promise<
				ExecutionResult<UpsertNodeSettingsMutation, E>
			>
		},
		NodeSettingsUpdated(
			variables?: NodeSettingsUpdatedSubscriptionVariables,
			options?: C
		): AsyncIterable<ExecutionResult<NodeSettingsUpdatedSubscription, E>> {
			return requester<
				NodeSettingsUpdatedSubscription,
				NodeSettingsUpdatedSubscriptionVariables
			>(NodeSettingsUpdatedDocument, variables, options) as AsyncIterable<
				ExecutionResult<NodeSettingsUpdatedSubscription, E>
			>
		},
		ValuesUpdated(
			variables?: ValuesUpdatedSubscriptionVariables,
			options?: C
		): AsyncIterable<ExecutionResult<ValuesUpdatedSubscription, E>> {
			return requester<
				ValuesUpdatedSubscription,
				ValuesUpdatedSubscriptionVariables
			>(ValuesUpdatedDocument, variables, options) as AsyncIterable<
				ExecutionResult<ValuesUpdatedSubscription, E>
			>
		},
		GetValues(
			variables: GetValuesQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetValuesQuery, E>> {
			return requester<GetValuesQuery, GetValuesQueryVariables>(
				GetValuesDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetValuesQuery, E>>
		},
		InsertListItem(
			variables: InsertListItemMutationVariables,
			options?: C
		): Promise<ExecutionResult<InsertListItemMutation, E>> {
			return requester<InsertListItemMutation, InsertListItemMutationVariables>(
				InsertListItemDocument,
				variables,
				options
			) as Promise<ExecutionResult<InsertListItemMutation, E>>
		},
		DeleteListItem(
			variables: DeleteListItemMutationVariables,
			options?: C
		): Promise<ExecutionResult<DeleteListItemMutation, E>> {
			return requester<DeleteListItemMutation, DeleteListItemMutationVariables>(
				DeleteListItemDocument,
				variables,
				options
			) as Promise<ExecutionResult<DeleteListItemMutation, E>>
		},
		UpsertValue(
			variables: UpsertValueMutationVariables,
			options?: C
		): Promise<ExecutionResult<UpsertValueMutation, E>> {
			return requester<UpsertValueMutation, UpsertValueMutationVariables>(
				UpsertValueDocument,
				variables,
				options
			) as Promise<ExecutionResult<UpsertValueMutation, E>>
		},
		DeleteValue(
			variables: DeleteValueMutationVariables,
			options?: C
		): Promise<ExecutionResult<DeleteValueMutation, E>> {
			return requester<DeleteValueMutation, DeleteValueMutationVariables>(
				DeleteValueDocument,
				variables,
				options
			) as Promise<ExecutionResult<DeleteValueMutation, E>>
		},
		ImportArray(
			variables: ImportArrayMutationVariables,
			options?: C
		): Promise<ExecutionResult<ImportArrayMutation, E>> {
			return requester<ImportArrayMutation, ImportArrayMutationVariables>(
				ImportArrayDocument,
				variables,
				options
			) as Promise<ExecutionResult<ImportArrayMutation, E>>
		},
		ImportObject(
			variables: ImportObjectMutationVariables,
			options?: C
		): Promise<ExecutionResult<ImportObjectMutation, E>> {
			return requester<ImportObjectMutation, ImportObjectMutationVariables>(
				ImportObjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<ImportObjectMutation, E>>
		},
		PreviewImport(
			variables: PreviewImportQueryVariables,
			options?: C
		): Promise<ExecutionResult<PreviewImportQuery, E>> {
			return requester<PreviewImportQuery, PreviewImportQueryVariables>(
				PreviewImportDocument,
				variables,
				options
			) as Promise<ExecutionResult<PreviewImportQuery, E>>
		},
		TruncateList(
			variables: TruncateListMutationVariables,
			options?: C
		): Promise<ExecutionResult<TruncateListMutation, E>> {
			return requester<TruncateListMutation, TruncateListMutationVariables>(
				TruncateListDocument,
				variables,
				options
			) as Promise<ExecutionResult<TruncateListMutation, E>>
		},
		UploadUrl(
			variables: UploadUrlMutationVariables,
			options?: C
		): Promise<ExecutionResult<UploadUrlMutation, E>> {
			return requester<UploadUrlMutation, UploadUrlMutationVariables>(
				UploadUrlDocument,
				variables,
				options
			) as Promise<ExecutionResult<UploadUrlMutation, E>>
		},
		GetListItems(
			variables: GetListItemsQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetListItemsQuery, E>> {
			return requester<GetListItemsQuery, GetListItemsQueryVariables>(
				GetListItemsDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetListItemsQuery, E>>
		},
		GetListColumns(
			variables: GetListColumnsQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetListColumnsQuery, E>> {
			return requester<GetListColumnsQuery, GetListColumnsQueryVariables>(
				GetListColumnsDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetListColumnsQuery, E>>
		},
		GetApiKeys(
			variables?: GetApiKeysQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetApiKeysQuery, E>> {
			return requester<GetApiKeysQuery, GetApiKeysQueryVariables>(
				GetApiKeysDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetApiKeysQuery, E>>
		},
		CreateApiKey(
			variables: CreateApiKeyMutationVariables,
			options?: C
		): Promise<ExecutionResult<CreateApiKeyMutation, E>> {
			return requester<CreateApiKeyMutation, CreateApiKeyMutationVariables>(
				CreateApiKeyDocument,
				variables,
				options
			) as Promise<ExecutionResult<CreateApiKeyMutation, E>>
		},
		DeleteApiKey(
			variables: DeleteApiKeyMutationVariables,
			options?: C
		): Promise<ExecutionResult<DeleteApiKeyMutation, E>> {
			return requester<DeleteApiKeyMutation, DeleteApiKeyMutationVariables>(
				DeleteApiKeyDocument,
				variables,
				options
			) as Promise<ExecutionResult<DeleteApiKeyMutation, E>>
		},
		ToggleApiKey(
			variables: ToggleApiKeyMutationVariables,
			options?: C
		): Promise<ExecutionResult<ToggleApiKeyMutation, E>> {
			return requester<ToggleApiKeyMutation, ToggleApiKeyMutationVariables>(
				ToggleApiKeyDocument,
				variables,
				options
			) as Promise<ExecutionResult<ToggleApiKeyMutation, E>>
		},
		ApiKeysUpdated(
			variables?: ApiKeysUpdatedSubscriptionVariables,
			options?: C
		): AsyncIterable<ExecutionResult<ApiKeysUpdatedSubscription, E>> {
			return requester<
				ApiKeysUpdatedSubscription,
				ApiKeysUpdatedSubscriptionVariables
			>(ApiKeysUpdatedDocument, variables, options) as AsyncIterable<
				ExecutionResult<ApiKeysUpdatedSubscription, E>
			>
		},
		GetUsers(
			variables?: GetUsersQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetUsersQuery, E>> {
			return requester<GetUsersQuery, GetUsersQueryVariables>(
				GetUsersDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetUsersQuery, E>>
		},
		InviteUser(
			variables: InviteUserMutationVariables,
			options?: C
		): Promise<ExecutionResult<InviteUserMutation, E>> {
			return requester<InviteUserMutation, InviteUserMutationVariables>(
				InviteUserDocument,
				variables,
				options
			) as Promise<ExecutionResult<InviteUserMutation, E>>
		},
		DeleteUser(
			variables: DeleteUserMutationVariables,
			options?: C
		): Promise<ExecutionResult<DeleteUserMutation, E>> {
			return requester<DeleteUserMutation, DeleteUserMutationVariables>(
				DeleteUserDocument,
				variables,
				options
			) as Promise<ExecutionResult<DeleteUserMutation, E>>
		},
		UsersUpdated(
			variables?: UsersUpdatedSubscriptionVariables,
			options?: C
		): AsyncIterable<ExecutionResult<UsersUpdatedSubscription, E>> {
			return requester<
				UsersUpdatedSubscription,
				UsersUpdatedSubscriptionVariables
			>(UsersUpdatedDocument, variables, options) as AsyncIterable<
				ExecutionResult<UsersUpdatedSubscription, E>
			>
		},
		GetDeletionImpact(
			variables: GetDeletionImpactQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetDeletionImpactQuery, E>> {
			return requester<GetDeletionImpactQuery, GetDeletionImpactQueryVariables>(
				GetDeletionImpactDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetDeletionImpactQuery, E>>
		},
		GetContentRevisions(
			variables?: GetContentRevisionsQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetContentRevisionsQuery, E>> {
			return requester<
				GetContentRevisionsQuery,
				GetContentRevisionsQueryVariables
			>(GetContentRevisionsDocument, variables, options) as Promise<
				ExecutionResult<GetContentRevisionsQuery, E>
			>
		},
		GetContentRevision(
			variables: GetContentRevisionQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetContentRevisionQuery, E>> {
			return requester<
				GetContentRevisionQuery,
				GetContentRevisionQueryVariables
			>(GetContentRevisionDocument, variables, options) as Promise<
				ExecutionResult<GetContentRevisionQuery, E>
			>
		},
		RestoreContentRevision(
			variables: RestoreContentRevisionMutationVariables,
			options?: C
		): Promise<ExecutionResult<RestoreContentRevisionMutation, E>> {
			return requester<
				RestoreContentRevisionMutation,
				RestoreContentRevisionMutationVariables
			>(RestoreContentRevisionDocument, variables, options) as Promise<
				ExecutionResult<RestoreContentRevisionMutation, E>
			>
		},
		GetWorkspace(
			variables?: GetWorkspaceQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetWorkspaceQuery, E>> {
			return requester<GetWorkspaceQuery, GetWorkspaceQueryVariables>(
				GetWorkspaceDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetWorkspaceQuery, E>>
		},
		GetPublication(
			variables?: GetPublicationQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetPublicationQuery, E>> {
			return requester<GetPublicationQuery, GetPublicationQueryVariables>(
				GetPublicationDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetPublicationQuery, E>>
		},
		PublishContent(
			variables: PublishContentMutationVariables,
			options?: C
		): Promise<ExecutionResult<PublishContentMutation, E>> {
			return requester<PublishContentMutation, PublishContentMutationVariables>(
				PublishContentDocument,
				variables,
				options
			) as Promise<ExecutionResult<PublishContentMutation, E>>
		},
		WorkspaceUpdated(
			variables?: WorkspaceUpdatedSubscriptionVariables,
			options?: C
		): AsyncIterable<ExecutionResult<WorkspaceUpdatedSubscription, E>> {
			return requester<
				WorkspaceUpdatedSubscription,
				WorkspaceUpdatedSubscriptionVariables
			>(WorkspaceUpdatedDocument, variables, options) as AsyncIterable<
				ExecutionResult<WorkspaceUpdatedSubscription, E>
			>
		},
		GetInvitations(
			variables?: GetInvitationsQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetInvitationsQuery, E>> {
			return requester<GetInvitationsQuery, GetInvitationsQueryVariables>(
				GetInvitationsDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetInvitationsQuery, E>>
		},
		GetInvitation(
			variables: GetInvitationQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetInvitationQuery, E>> {
			return requester<GetInvitationQuery, GetInvitationQueryVariables>(
				GetInvitationDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetInvitationQuery, E>>
		},
		CreateProject(
			variables: CreateProjectMutationVariables,
			options?: C
		): Promise<ExecutionResult<CreateProjectMutation, E>> {
			return requester<CreateProjectMutation, CreateProjectMutationVariables>(
				CreateProjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<CreateProjectMutation, E>>
		},
		SwitchProject(
			variables: SwitchProjectMutationVariables,
			options?: C
		): Promise<ExecutionResult<SwitchProjectMutation, E>> {
			return requester<SwitchProjectMutation, SwitchProjectMutationVariables>(
				SwitchProjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<SwitchProjectMutation, E>>
		},
		RenameProject(
			variables: RenameProjectMutationVariables,
			options?: C
		): Promise<ExecutionResult<RenameProjectMutation, E>> {
			return requester<RenameProjectMutation, RenameProjectMutationVariables>(
				RenameProjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<RenameProjectMutation, E>>
		},
		DeleteProject(
			variables: DeleteProjectMutationVariables,
			options?: C
		): Promise<ExecutionResult<DeleteProjectMutation, E>> {
			return requester<DeleteProjectMutation, DeleteProjectMutationVariables>(
				DeleteProjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<DeleteProjectMutation, E>>
		},
		TransferProjectOwnership(
			variables: TransferProjectOwnershipMutationVariables,
			options?: C
		): Promise<ExecutionResult<TransferProjectOwnershipMutation, E>> {
			return requester<
				TransferProjectOwnershipMutation,
				TransferProjectOwnershipMutationVariables
			>(TransferProjectOwnershipDocument, variables, options) as Promise<
				ExecutionResult<TransferProjectOwnershipMutation, E>
			>
		},
		UpdateUserRole(
			variables: UpdateUserRoleMutationVariables,
			options?: C
		): Promise<ExecutionResult<UpdateUserRoleMutation, E>> {
			return requester<UpdateUserRoleMutation, UpdateUserRoleMutationVariables>(
				UpdateUserRoleDocument,
				variables,
				options
			) as Promise<ExecutionResult<UpdateUserRoleMutation, E>>
		},
		RevokeInvitation(
			variables: RevokeInvitationMutationVariables,
			options?: C
		): Promise<ExecutionResult<RevokeInvitationMutation, E>> {
			return requester<
				RevokeInvitationMutation,
				RevokeInvitationMutationVariables
			>(RevokeInvitationDocument, variables, options) as Promise<
				ExecutionResult<RevokeInvitationMutation, E>
			>
		},
		AcceptInvitation(
			variables: AcceptInvitationMutationVariables,
			options?: C
		): Promise<ExecutionResult<AcceptInvitationMutation, E>> {
			return requester<
				AcceptInvitationMutation,
				AcceptInvitationMutationVariables
			>(AcceptInvitationDocument, variables, options) as Promise<
				ExecutionResult<AcceptInvitationMutation, E>
			>
		},
		ExportProject(
			variables?: ExportProjectMutationVariables,
			options?: C
		): Promise<ExecutionResult<ExportProjectMutation, E>> {
			return requester<ExportProjectMutation, ExportProjectMutationVariables>(
				ExportProjectDocument,
				variables,
				options
			) as Promise<ExecutionResult<ExportProjectMutation, E>>
		},
		PreviewProjectImport(
			variables: PreviewProjectImportQueryVariables,
			options?: C
		): Promise<ExecutionResult<PreviewProjectImportQuery, E>> {
			return requester<
				PreviewProjectImportQuery,
				PreviewProjectImportQueryVariables
			>(PreviewProjectImportDocument, variables, options) as Promise<
				ExecutionResult<PreviewProjectImportQuery, E>
			>
		},
		ImportProjectArchive(
			variables: ImportProjectArchiveMutationVariables,
			options?: C
		): Promise<ExecutionResult<ImportProjectArchiveMutation, E>> {
			return requester<
				ImportProjectArchiveMutation,
				ImportProjectArchiveMutationVariables
			>(ImportProjectArchiveDocument, variables, options) as Promise<
				ExecutionResult<ImportProjectArchiveMutation, E>
			>
		},
		GetListPage(
			variables: GetListPageQueryVariables,
			options?: C
		): Promise<ExecutionResult<GetListPageQuery, E>> {
			return requester<GetListPageQuery, GetListPageQueryVariables>(
				GetListPageDocument,
				variables,
				options
			) as Promise<ExecutionResult<GetListPageQuery, E>>
		},
		FinalizeUpload(
			variables: FinalizeUploadMutationVariables,
			options?: C
		): Promise<ExecutionResult<FinalizeUploadMutation, E>> {
			return requester<FinalizeUploadMutation, FinalizeUploadMutationVariables>(
				FinalizeUploadDocument,
				variables,
				options
			) as Promise<ExecutionResult<FinalizeUploadMutation, E>>
		}
	}
}
export type Sdk = ReturnType<typeof getSdk>
