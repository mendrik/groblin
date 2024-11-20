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
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any; }
};

export type ChangeNodeInput = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  parent_id?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<NodeType>;
};

export type InsertNode = {
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  parent_id?: InputMaybe<Scalars['Int']['input']>;
  type: NodeType;
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
  deleteNodeById: Scalars['Boolean']['output'];
  insertNode: Node;
  login: Token;
  logout: Scalars['Boolean']['output'];
  register: Scalars['Boolean']['output'];
  updateNode: Scalars['Boolean']['output'];
};


export type MutationDeleteNodeByIdArgs = {
  id: Scalars['Int']['input'];
  order: Scalars['Int']['input'];
  parent_id: Scalars['Int']['input'];
};


export type MutationInsertNodeArgs = {
  data: InsertNode;
};


export type MutationLoginArgs = {
  data: Login;
};


export type MutationRegisterArgs = {
  data: Registration;
};


export type MutationUpdateNodeArgs = {
  data: ChangeNodeInput;
};

export type Node = {
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  parent_id?: Maybe<Scalars['Int']['output']>;
  type: NodeType;
};

export enum NodeType {
  Boolean = 'boolean',
  Date = 'date',
  List = 'list',
  Number = 'number',
  Object = 'object',
  Root = 'root',
  Schema = 'schema',
  String = 'string'
}

export type Project = {
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type ProjectData = {
  nodes: Array<Node>;
  project: Project;
  user: LoggedInUser;
  values: Array<Value>;
};

export type Query = {
  createListItem: Array<Value>;
  getNodes: Array<Node>;
  getProject: ProjectData;
  getValues: Array<Value>;
};


export type QueryCreateListItemArgs = {
  data: Array<Scalars['Boolean']['input']>;
};


export type QueryGetValuesArgs = {
  listItems: Array<SelectedListItem>;
};

export type Registration = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type SelectedListItem = {
  id: Scalars['Int']['input'];
};

export type Subscription = {
  nodesUpdated: Scalars['Boolean']['output'];
  valuesUpdated: Scalars['Boolean']['output'];
};


export type SubscriptionNodesUpdatedArgs = {
  lastProjectId: Scalars['Int']['input'];
};


export type SubscriptionValuesUpdatedArgs = {
  lastProjectId: Scalars['Int']['input'];
};

export type Token = {
  expiresDate: Scalars['DateTimeISO']['output'];
  token: Scalars['String']['output'];
};

export type Value = {
  id: Scalars['Int']['output'];
  node_id: Scalars['Int']['output'];
  project_id: Scalars['Int']['output'];
};

export type GetProjectQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProjectQuery = { getProject: { user: { id: number, email: string, name: string, lastProjectId: number }, project: { name: string }, nodes: Array<{ id: number, name: string, order: number, type: NodeType, parent_id?: number | null }> } };

export type NodeFragment = { id: number, name: string, order: number, type: NodeType, parent_id?: number | null };

export type NodesUpdatedSubscriptionVariables = Exact<{
  lastProjectId: Scalars['Int']['input'];
}>;


export type NodesUpdatedSubscription = { nodesUpdated: boolean };

export type GetNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodesQuery = { getNodes: Array<{ id: number, name: string, order: number, type: NodeType, parent_id?: number | null }> };

export type InsertNodeMutationVariables = Exact<{
  data: InsertNode;
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

export type ValuesUpdatedSubscriptionVariables = Exact<{
  lastProjectId: Scalars['Int']['input'];
}>;


export type ValuesUpdatedSubscription = { valuesUpdated: boolean };

export type GetValuesQueryVariables = Exact<{
  listItems: Array<SelectedListItem> | SelectedListItem;
}>;


export type GetValuesQuery = { getValues: Array<{ id: number, node_id: number }> };

export const NodeFragmentDoc = `
    fragment Node on Node {
  id
  name
  order
  type
  parent_id
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
      name
    }
    nodes {
      ...Node
    }
  }
}
    ${NodeFragmentDoc}`;
export const NodesUpdatedDocument = `
    subscription NodesUpdated($lastProjectId: Int!) {
  nodesUpdated(lastProjectId: $lastProjectId)
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
    mutation InsertNode($data: InsertNode!) {
  insertNode(data: $data) {
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
    subscription ValuesUpdated($lastProjectId: Int!) {
  valuesUpdated(lastProjectId: $lastProjectId)
}
    `;
export const GetValuesDocument = `
    query GetValues($listItems: [SelectedListItem!]!) {
  getValues(listItems: $listItems) {
    id
    node_id
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: string, vars?: V, options?: C) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    GetProject(variables?: GetProjectQueryVariables, options?: C): Promise<ExecutionResult<GetProjectQuery, E>> {
      return requester<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, variables, options) as Promise<ExecutionResult<GetProjectQuery, E>>;
    },
    NodesUpdated(variables: NodesUpdatedSubscriptionVariables, options?: C): AsyncIterable<ExecutionResult<NodesUpdatedSubscription, E>> {
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
    Register(variables: RegisterMutationVariables, options?: C): Promise<ExecutionResult<RegisterMutation, E>> {
      return requester<RegisterMutation, RegisterMutationVariables>(RegisterDocument, variables, options) as Promise<ExecutionResult<RegisterMutation, E>>;
    },
    Login(variables: LoginMutationVariables, options?: C): Promise<ExecutionResult<LoginMutation, E>> {
      return requester<LoginMutation, LoginMutationVariables>(LoginDocument, variables, options) as Promise<ExecutionResult<LoginMutation, E>>;
    },
    Logout(variables?: LogoutMutationVariables, options?: C): Promise<ExecutionResult<LogoutMutation, E>> {
      return requester<LogoutMutation, LogoutMutationVariables>(LogoutDocument, variables, options) as Promise<ExecutionResult<LogoutMutation, E>>;
    },
    ValuesUpdated(variables: ValuesUpdatedSubscriptionVariables, options?: C): AsyncIterable<ExecutionResult<ValuesUpdatedSubscription, E>> {
      return requester<ValuesUpdatedSubscription, ValuesUpdatedSubscriptionVariables>(ValuesUpdatedDocument, variables, options) as AsyncIterable<ExecutionResult<ValuesUpdatedSubscription, E>>;
    },
    GetValues(variables: GetValuesQueryVariables, options?: C): Promise<ExecutionResult<GetValuesQuery, E>> {
      return requester<GetValuesQuery, GetValuesQueryVariables>(GetValuesDocument, variables, options) as Promise<ExecutionResult<GetValuesQuery, E>>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;