import type { ExecutionResult } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any; }
};

export type ApiKey = {
  created_at: Scalars['DateTimeISO']['output'];
  expires_at?: Maybe<Scalars['DateTimeISO']['output']>;
  is_active: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  last_used?: Maybe<Scalars['DateTimeISO']['output']>;
  name: Scalars['String']['output'];
};

export type ChangeNodeInput = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  parent_id?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<NodeType>;
};

export type CreateApiKeyInput = {
  expires_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  name: Scalars['String']['input'];
};

export type GetValues = {
  ids: Array<Scalars['Int']['input']>;
};

export type InsertListItem = {
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  name: Scalars['String']['input'];
  node_id: Scalars['Int']['input'];
};

export type InsertNode = {
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  parent_id?: InputMaybe<Scalars['Int']['input']>;
  type: NodeType;
};

export type JsonArrayImportInput = {
  data: Scalars['String']['input'];
  external_id?: InputMaybe<Scalars['String']['input']>;
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  node_id: Scalars['Int']['input'];
  structure: Scalars['Boolean']['input'];
};

export type ListItem = {
  children: Array<Value>;
  id: Scalars['Int']['output'];
  list_path?: Maybe<Array<Scalars['Int']['output']>>;
  node_id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['JSONObject']['output']>;
};

export type ListRequest = {
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  node_id: Scalars['Int']['input'];
};

export type LoggedInUser = {
  email: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  lastProjectId: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type Login = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  rememberMe?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Mutation = {
  createApiKey: ApiKey;
  deleteListItem: Scalars['Boolean']['output'];
  deleteNodeById: Scalars['Boolean']['output'];
  importArray: Scalars['Boolean']['output'];
  insertListItem: Scalars['Int']['output'];
  insertNode: Node;
  login: Token;
  logout: Scalars['Boolean']['output'];
  register: Scalars['Boolean']['output'];
  truncate: Scalars['Boolean']['output'];
  updateNode: Scalars['Boolean']['output'];
  uploadUrl: Upload;
  upsertNodeSettings: Scalars['Int']['output'];
  upsertValue: Scalars['Int']['output'];
};


export type MutationCreateApiKeyArgs = {
  data: CreateApiKeyInput;
};


export type MutationDeleteListItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteNodeByIdArgs = {
  id: Scalars['Int']['input'];
  order: Scalars['Int']['input'];
  parent_id: Scalars['Int']['input'];
};


export type MutationImportArrayArgs = {
  data: JsonArrayImportInput;
};


export type MutationInsertListItemArgs = {
  listItem: InsertListItem;
};


export type MutationInsertNodeArgs = {
  data: InsertNode;
  settings?: InputMaybe<Scalars['JSONObject']['input']>;
};


export type MutationLoginArgs = {
  data: Login;
};


export type MutationRegisterArgs = {
  data: Registration;
};


export type MutationTruncateArgs = {
  data: TruncateValue;
};


export type MutationUpdateNodeArgs = {
  data: ChangeNodeInput;
};


export type MutationUploadUrlArgs = {
  filename: Scalars['String']['input'];
};


export type MutationUpsertNodeSettingsArgs = {
  data: UpsertNodeSettings;
};


export type MutationUpsertValueArgs = {
  data: UpsertValue;
};

export type Node = {
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  parent_id?: Maybe<Scalars['Int']['output']>;
  type: NodeType;
};

export type NodeSettings = {
  id: Scalars['Int']['output'];
  node_id: Scalars['Int']['output'];
  settings: Scalars['JSONObject']['output'];
};

export enum NodeType {
  Article = 'article',
  Boolean = 'boolean',
  Choice = 'choice',
  Color = 'color',
  Date = 'date',
  List = 'list',
  Media = 'media',
  Number = 'number',
  Object = 'object',
  Reference = 'reference',
  Root = 'root',
  String = 'string'
}

export type Project = {
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type ProjectData = {
  nodeSettings: Array<NodeSettings>;
  nodes: Array<Node>;
  project: Project;
  user: LoggedInUser;
  values: Array<Value>;
};

export type Query = {
  getApiKeys: Array<ApiKey>;
  getListColumns: Array<Node>;
  getListItems: Array<ListItem>;
  getNodeSettings: Array<NodeSettings>;
  getNodes: Array<Node>;
  getProject: ProjectData;
  getValues: Array<Value>;
};


export type QueryGetListColumnsArgs = {
  node_id: Scalars['Int']['input'];
};


export type QueryGetListItemsArgs = {
  request: ListRequest;
};


export type QueryGetValuesArgs = {
  data: GetValues;
};

export type Registration = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Subscription = {
  apiKeysUpdated: Scalars['Boolean']['output'];
  nodeSettingsUpdated: Scalars['Boolean']['output'];
  nodesUpdated: Scalars['Boolean']['output'];
  valuesUpdated: Value;
};

export type Token = {
  expiresDate: Scalars['DateTimeISO']['output'];
  token: Scalars['String']['output'];
};

export type TruncateValue = {
  node_id: Scalars['Int']['input'];
};

export type Upload = {
  object: Scalars['String']['output'];
  signedUrl: Scalars['String']['output'];
};

export type UpsertNodeSettings = {
  id?: InputMaybe<Scalars['Int']['input']>;
  node_id: Scalars['Int']['input'];
  settings: Scalars['JSONObject']['input'];
};

export type UpsertValue = {
  id?: InputMaybe<Scalars['Int']['input']>;
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  node_id: Scalars['Int']['input'];
  value: Scalars['JSONObject']['input'];
};

export type Value = {
  id: Scalars['Int']['output'];
  list_path?: Maybe<Array<Scalars['Int']['output']>>;
  node_id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['JSONObject']['output']>;
};

export type GetProjectQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProjectQuery = { getProject: { user: { id: number, email: string, name: string, lastProjectId: number }, project: { id: number, name: string }, nodes: Array<{ id: number, name: string, order: number, type: NodeType, parent_id?: number | null }>, values: Array<{ id: number, node_id: number, order: number, value?: any | null, list_path?: Array<number> | null, updated_at: any }>, nodeSettings: Array<{ id: number, node_id: number, settings: any }> } };

export type ValueFragment = { id: number, node_id: number, order: number, value?: any | null, list_path?: Array<number> | null, updated_at: any };

export type NodeFragment = { id: number, name: string, order: number, type: NodeType, parent_id?: number | null };

export type NodeSettingsFragment = { id: number, node_id: number, settings: any };

export type NodesUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NodesUpdatedSubscription = { nodesUpdated: boolean };

export type GetNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodesQuery = { getNodes: Array<{ id: number, name: string, order: number, type: NodeType, parent_id?: number | null }> };

export type InsertNodeMutationVariables = Exact<{
  data: InsertNode;
  settings?: InputMaybe<Scalars['JSONObject']['input']>;
}>;


export type InsertNodeMutation = { insertNode: { id: number } };

export type UpdateNodeMutationVariables = Exact<{
  data: ChangeNodeInput;
}>;


export type UpdateNodeMutation = { updateNode: boolean };

export type DeleteNodeByIdMutationVariables = Exact<{
  order: Scalars['Int']['input'];
  parent_id: Scalars['Int']['input'];
  id: Scalars['Int']['input'];
}>;


export type DeleteNodeByIdMutation = { deleteNodeById: boolean };

export type GetNodeSttingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodeSttingsQuery = { getNodeSettings: Array<{ id: number, settings: any, node_id: number }> };

export type UpsertNodeSettingsMutationVariables = Exact<{
  data: UpsertNodeSettings;
}>;


export type UpsertNodeSettingsMutation = { upsertNodeSettings: number };

export type NodeSettingsUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NodeSettingsUpdatedSubscription = { nodeSettingsUpdated: boolean };

export type RegisterMutationVariables = Exact<{
  data: Registration;
}>;


export type RegisterMutation = { register: boolean };

export type LoginMutationVariables = Exact<{
  data: Login;
}>;


export type LoginMutation = { login: { token: string, expiresDate: any } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type ValuesUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type ValuesUpdatedSubscription = { valuesUpdated: { id: number, node_id: number, order: number, value?: any | null, list_path?: Array<number> | null, updated_at: any } };

export type GetValuesQueryVariables = Exact<{
  data: GetValues;
}>;


export type GetValuesQuery = { getValues: Array<{ id: number, node_id: number, order: number, value?: any | null, list_path?: Array<number> | null, updated_at: any }> };

export type InsertListItemMutationVariables = Exact<{
  listItem: InsertListItem;
}>;


export type InsertListItemMutation = { insertListItem: number };

export type DeleteListItemMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteListItemMutation = { deleteListItem: boolean };

export type UpsertValueMutationVariables = Exact<{
  data: UpsertValue;
}>;


export type UpsertValueMutation = { upsertValue: number };

export type ImportArrayMutationVariables = Exact<{
  data: JsonArrayImportInput;
}>;


export type ImportArrayMutation = { importArray: boolean };

export type TruncateListMutationVariables = Exact<{
  data: TruncateValue;
}>;


export type TruncateListMutation = { truncate: boolean };

export type UploadUrlMutationVariables = Exact<{
  filename: Scalars['String']['input'];
}>;


export type UploadUrlMutation = { uploadUrl: { signedUrl: string, object: string } };

export type GetListItemsQueryVariables = Exact<{
  request: ListRequest;
}>;


export type GetListItemsQuery = { getListItems: Array<{ id: number, node_id: number, value?: any | null, order: number, list_path?: Array<number> | null, updated_at: any, children: Array<{ id: number, node_id: number, order: number, value?: any | null, list_path?: Array<number> | null, updated_at: any }> }> };

export type GetListColumnsQueryVariables = Exact<{
  node_id: Scalars['Int']['input'];
}>;


export type GetListColumnsQuery = { getListColumns: Array<{ id: number, name: string, order: number, type: NodeType, parent_id?: number | null }> };

export type ApiKeyFragment = { name: string, key: string, is_active: boolean, created_at: any, expires_at?: any | null, last_used?: any | null };

export type GetApiKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type GetApiKeysQuery = { getApiKeys: Array<{ name: string, key: string, is_active: boolean, created_at: any, expires_at?: any | null, last_used?: any | null }> };

export type CreateApiKeyMutationVariables = Exact<{
  data: CreateApiKeyInput;
}>;


export type CreateApiKeyMutation = { createApiKey: { name: string, key: string, is_active: boolean, created_at: any, expires_at?: any | null, last_used?: any | null } };

export type ApiKeysUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type ApiKeysUpdatedSubscription = { apiKeysUpdated: boolean };

export const ValueFragmentDoc = `
    fragment Value on Value {
  id
  node_id
  order
  value
  list_path
  updated_at
}
    `;
export const NodeFragmentDoc = `
    fragment Node on Node {
  id
  name
  order
  type
  parent_id
}
    `;
export const NodeSettingsFragmentDoc = `
    fragment NodeSettings on NodeSettings {
  id
  node_id
  settings
}
    `;
export const ApiKeyFragmentDoc = `
    fragment ApiKey on ApiKey {
  name
  key
  is_active
  created_at
  expires_at
  last_used
}
    `;
export const GetProjectDocument = `
    query GetProject {
  getProject {
    user {
      id
      email
      name
      lastProjectId
    }
    project {
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
${NodeSettingsFragmentDoc}`;
export const NodesUpdatedDocument = `
    subscription NodesUpdated {
  nodesUpdated
}
    `;
export const GetNodesDocument = `
    query GetNodes {
  getNodes {
    ...Node
  }
}
    ${NodeFragmentDoc}`;
export const InsertNodeDocument = `
    mutation InsertNode($data: InsertNode!, $settings: JSONObject) {
  insertNode(data: $data, settings: $settings) {
    id
  }
}
    `;
export const UpdateNodeDocument = `
    mutation UpdateNode($data: ChangeNodeInput!) {
  updateNode(data: $data)
}
    `;
export const DeleteNodeByIdDocument = `
    mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {
  deleteNodeById(order: $order, parent_id: $parent_id, id: $id)
}
    `;
export const GetNodeSttingsDocument = `
    query GetNodeSttings {
  getNodeSettings {
    id
    settings
    node_id
  }
}
    `;
export const UpsertNodeSettingsDocument = `
    mutation UpsertNodeSettings($data: UpsertNodeSettings!) {
  upsertNodeSettings(data: $data)
}
    `;
export const NodeSettingsUpdatedDocument = `
    subscription NodeSettingsUpdated {
  nodeSettingsUpdated
}
    `;
export const RegisterDocument = `
    mutation Register($data: Registration!) {
  register(data: $data)
}
    `;
export const LoginDocument = `
    mutation Login($data: Login!) {
  login(data: $data) {
    token
    expiresDate
  }
}
    `;
export const LogoutDocument = `
    mutation Logout {
  logout
}
    `;
export const ValuesUpdatedDocument = `
    subscription ValuesUpdated {
  valuesUpdated {
    ...Value
  }
}
    ${ValueFragmentDoc}`;
export const GetValuesDocument = `
    query GetValues($data: GetValues!) {
  getValues(data: $data) {
    ...Value
  }
}
    ${ValueFragmentDoc}`;
export const InsertListItemDocument = `
    mutation InsertListItem($listItem: InsertListItem!) {
  insertListItem(listItem: $listItem)
}
    `;
export const DeleteListItemDocument = `
    mutation DeleteListItem($id: Int!) {
  deleteListItem(id: $id)
}
    `;
export const UpsertValueDocument = `
    mutation UpsertValue($data: UpsertValue!) {
  upsertValue(data: $data)
}
    `;
export const ImportArrayDocument = `
    mutation ImportArray($data: JsonArrayImportInput!) {
  importArray(data: $data)
}
    `;
export const TruncateListDocument = `
    mutation TruncateList($data: TruncateValue!) {
  truncate(data: $data)
}
    `;
export const UploadUrlDocument = `
    mutation UploadUrl($filename: String!) {
  uploadUrl(filename: $filename) {
    signedUrl
    object
  }
}
    `;
export const GetListItemsDocument = `
    query GetListItems($request: ListRequest!) {
  getListItems(request: $request) {
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
    ${ValueFragmentDoc}`;
export const GetListColumnsDocument = `
    query GetListColumns($node_id: Int!) {
  getListColumns(node_id: $node_id) {
    ...Node
  }
}
    ${NodeFragmentDoc}`;
export const GetApiKeysDocument = `
    query GetApiKeys {
  getApiKeys {
    ...ApiKey
  }
}
    ${ApiKeyFragmentDoc}`;
export const CreateApiKeyDocument = `
    mutation CreateApiKey($data: CreateApiKeyInput!) {
  createApiKey(data: $data) {
    ...ApiKey
  }
}
    ${ApiKeyFragmentDoc}`;
export const ApiKeysUpdatedDocument = `
    subscription ApiKeysUpdated {
  apiKeysUpdated
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: string, vars?: V, options?: C) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    GetProject(variables?: GetProjectQueryVariables, options?: C): Promise<ExecutionResult<GetProjectQuery, E>> {
      return requester<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, variables, options) as Promise<ExecutionResult<GetProjectQuery, E>>;
    },
    NodesUpdated(variables?: NodesUpdatedSubscriptionVariables, options?: C): AsyncIterable<ExecutionResult<NodesUpdatedSubscription, E>> {
      return requester<NodesUpdatedSubscription, NodesUpdatedSubscriptionVariables>(NodesUpdatedDocument, variables, options) as AsyncIterable<ExecutionResult<NodesUpdatedSubscription, E>>;
    },
    GetNodes(variables?: GetNodesQueryVariables, options?: C): Promise<ExecutionResult<GetNodesQuery, E>> {
      return requester<GetNodesQuery, GetNodesQueryVariables>(GetNodesDocument, variables, options) as Promise<ExecutionResult<GetNodesQuery, E>>;
    },
    InsertNode(variables: InsertNodeMutationVariables, options?: C): Promise<ExecutionResult<InsertNodeMutation, E>> {
      return requester<InsertNodeMutation, InsertNodeMutationVariables>(InsertNodeDocument, variables, options) as Promise<ExecutionResult<InsertNodeMutation, E>>;
    },
    UpdateNode(variables: UpdateNodeMutationVariables, options?: C): Promise<ExecutionResult<UpdateNodeMutation, E>> {
      return requester<UpdateNodeMutation, UpdateNodeMutationVariables>(UpdateNodeDocument, variables, options) as Promise<ExecutionResult<UpdateNodeMutation, E>>;
    },
    DeleteNodeById(variables: DeleteNodeByIdMutationVariables, options?: C): Promise<ExecutionResult<DeleteNodeByIdMutation, E>> {
      return requester<DeleteNodeByIdMutation, DeleteNodeByIdMutationVariables>(DeleteNodeByIdDocument, variables, options) as Promise<ExecutionResult<DeleteNodeByIdMutation, E>>;
    },
    GetNodeSttings(variables?: GetNodeSttingsQueryVariables, options?: C): Promise<ExecutionResult<GetNodeSttingsQuery, E>> {
      return requester<GetNodeSttingsQuery, GetNodeSttingsQueryVariables>(GetNodeSttingsDocument, variables, options) as Promise<ExecutionResult<GetNodeSttingsQuery, E>>;
    },
    UpsertNodeSettings(variables: UpsertNodeSettingsMutationVariables, options?: C): Promise<ExecutionResult<UpsertNodeSettingsMutation, E>> {
      return requester<UpsertNodeSettingsMutation, UpsertNodeSettingsMutationVariables>(UpsertNodeSettingsDocument, variables, options) as Promise<ExecutionResult<UpsertNodeSettingsMutation, E>>;
    },
    NodeSettingsUpdated(variables?: NodeSettingsUpdatedSubscriptionVariables, options?: C): AsyncIterable<ExecutionResult<NodeSettingsUpdatedSubscription, E>> {
      return requester<NodeSettingsUpdatedSubscription, NodeSettingsUpdatedSubscriptionVariables>(NodeSettingsUpdatedDocument, variables, options) as AsyncIterable<ExecutionResult<NodeSettingsUpdatedSubscription, E>>;
    },
    Register(variables: RegisterMutationVariables, options?: C): Promise<ExecutionResult<RegisterMutation, E>> {
      return requester<RegisterMutation, RegisterMutationVariables>(RegisterDocument, variables, options) as Promise<ExecutionResult<RegisterMutation, E>>;
    },
    Login(variables: LoginMutationVariables, options?: C): Promise<ExecutionResult<LoginMutation, E>> {
      return requester<LoginMutation, LoginMutationVariables>(LoginDocument, variables, options) as Promise<ExecutionResult<LoginMutation, E>>;
    },
    Logout(variables?: LogoutMutationVariables, options?: C): Promise<ExecutionResult<LogoutMutation, E>> {
      return requester<LogoutMutation, LogoutMutationVariables>(LogoutDocument, variables, options) as Promise<ExecutionResult<LogoutMutation, E>>;
    },
    ValuesUpdated(variables?: ValuesUpdatedSubscriptionVariables, options?: C): AsyncIterable<ExecutionResult<ValuesUpdatedSubscription, E>> {
      return requester<ValuesUpdatedSubscription, ValuesUpdatedSubscriptionVariables>(ValuesUpdatedDocument, variables, options) as AsyncIterable<ExecutionResult<ValuesUpdatedSubscription, E>>;
    },
    GetValues(variables: GetValuesQueryVariables, options?: C): Promise<ExecutionResult<GetValuesQuery, E>> {
      return requester<GetValuesQuery, GetValuesQueryVariables>(GetValuesDocument, variables, options) as Promise<ExecutionResult<GetValuesQuery, E>>;
    },
    InsertListItem(variables: InsertListItemMutationVariables, options?: C): Promise<ExecutionResult<InsertListItemMutation, E>> {
      return requester<InsertListItemMutation, InsertListItemMutationVariables>(InsertListItemDocument, variables, options) as Promise<ExecutionResult<InsertListItemMutation, E>>;
    },
    DeleteListItem(variables: DeleteListItemMutationVariables, options?: C): Promise<ExecutionResult<DeleteListItemMutation, E>> {
      return requester<DeleteListItemMutation, DeleteListItemMutationVariables>(DeleteListItemDocument, variables, options) as Promise<ExecutionResult<DeleteListItemMutation, E>>;
    },
    UpsertValue(variables: UpsertValueMutationVariables, options?: C): Promise<ExecutionResult<UpsertValueMutation, E>> {
      return requester<UpsertValueMutation, UpsertValueMutationVariables>(UpsertValueDocument, variables, options) as Promise<ExecutionResult<UpsertValueMutation, E>>;
    },
    ImportArray(variables: ImportArrayMutationVariables, options?: C): Promise<ExecutionResult<ImportArrayMutation, E>> {
      return requester<ImportArrayMutation, ImportArrayMutationVariables>(ImportArrayDocument, variables, options) as Promise<ExecutionResult<ImportArrayMutation, E>>;
    },
    TruncateList(variables: TruncateListMutationVariables, options?: C): Promise<ExecutionResult<TruncateListMutation, E>> {
      return requester<TruncateListMutation, TruncateListMutationVariables>(TruncateListDocument, variables, options) as Promise<ExecutionResult<TruncateListMutation, E>>;
    },
    UploadUrl(variables: UploadUrlMutationVariables, options?: C): Promise<ExecutionResult<UploadUrlMutation, E>> {
      return requester<UploadUrlMutation, UploadUrlMutationVariables>(UploadUrlDocument, variables, options) as Promise<ExecutionResult<UploadUrlMutation, E>>;
    },
    GetListItems(variables: GetListItemsQueryVariables, options?: C): Promise<ExecutionResult<GetListItemsQuery, E>> {
      return requester<GetListItemsQuery, GetListItemsQueryVariables>(GetListItemsDocument, variables, options) as Promise<ExecutionResult<GetListItemsQuery, E>>;
    },
    GetListColumns(variables: GetListColumnsQueryVariables, options?: C): Promise<ExecutionResult<GetListColumnsQuery, E>> {
      return requester<GetListColumnsQuery, GetListColumnsQueryVariables>(GetListColumnsDocument, variables, options) as Promise<ExecutionResult<GetListColumnsQuery, E>>;
    },
    GetApiKeys(variables?: GetApiKeysQueryVariables, options?: C): Promise<ExecutionResult<GetApiKeysQuery, E>> {
      return requester<GetApiKeysQuery, GetApiKeysQueryVariables>(GetApiKeysDocument, variables, options) as Promise<ExecutionResult<GetApiKeysQuery, E>>;
    },
    CreateApiKey(variables: CreateApiKeyMutationVariables, options?: C): Promise<ExecutionResult<CreateApiKeyMutation, E>> {
      return requester<CreateApiKeyMutation, CreateApiKeyMutationVariables>(CreateApiKeyDocument, variables, options) as Promise<ExecutionResult<CreateApiKeyMutation, E>>;
    },
    ApiKeysUpdated(variables?: ApiKeysUpdatedSubscriptionVariables, options?: C): AsyncIterable<ExecutionResult<ApiKeysUpdatedSubscription, E>> {
      return requester<ApiKeysUpdatedSubscription, ApiKeysUpdatedSubscriptionVariables>(ApiKeysUpdatedDocument, variables, options) as AsyncIterable<ExecutionResult<ApiKeysUpdatedSubscription, E>>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;