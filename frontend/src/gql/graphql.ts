/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
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

export type LoggedinUser = {
  __typename?: 'LoggedinUser';
  email: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  token: Scalars['String']['output'];
};

export type Login = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteNodeById: Scalars['Boolean']['output'];
  insertNode: Node;
  login: LoggedinUser;
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
  __typename?: 'Node';
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
  Schema = 'schema',
  String = 'string'
}

export type Query = {
  __typename?: 'Query';
  getNodes: Array<Node>;
};

export type Registration = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  nodesUpdated: Scalars['Boolean']['output'];
};

export type NodesUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NodesUpdatedSubscription = { __typename?: 'Subscription', nodesUpdated: boolean };

export type GetNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodesQuery = { __typename?: 'Query', getNodes: Array<{ __typename?: 'Node', id: number, name: string, order: number, type: NodeType, parent_id?: number | null }> };

export type InsertNodeMutationVariables = Exact<{
  data: InsertNode;
}>;


export type InsertNodeMutation = { __typename?: 'Mutation', insertNode: { __typename?: 'Node', id: number } };

export type UpdateNodeMutationVariables = Exact<{
  data: ChangeNodeInput;
}>;


export type UpdateNodeMutation = { __typename?: 'Mutation', updateNode: boolean };

export type DeleteNodeByIdMutationVariables = Exact<{
  order: Scalars['Int']['input'];
  parent_id: Scalars['Int']['input'];
  id: Scalars['Int']['input'];
}>;


export type DeleteNodeByIdMutation = { __typename?: 'Mutation', deleteNodeById: boolean };

export type RegisterMutationVariables = Exact<{
  data: Registration;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: boolean };

export type LoginMutationVariables = Exact<{
  data: Login;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'LoggedinUser', id: number, token: string, name: string, email: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any> | undefined) {
    super(value);
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const NodesUpdatedDocument = new TypedDocumentString(`
    subscription NodesUpdated {
  nodesUpdated
}
    `) as unknown as TypedDocumentString<NodesUpdatedSubscription, NodesUpdatedSubscriptionVariables>;
export const GetNodesDocument = new TypedDocumentString(`
    query GetNodes {
  getNodes {
    id
    name
    order
    type
    parent_id
  }
}
    `) as unknown as TypedDocumentString<GetNodesQuery, GetNodesQueryVariables>;
export const InsertNodeDocument = new TypedDocumentString(`
    mutation InsertNode($data: InsertNode!) {
  insertNode(data: $data) {
    id
  }
}
    `) as unknown as TypedDocumentString<InsertNodeMutation, InsertNodeMutationVariables>;
export const UpdateNodeDocument = new TypedDocumentString(`
    mutation UpdateNode($data: ChangeNodeInput!) {
  updateNode(data: $data)
}
    `) as unknown as TypedDocumentString<UpdateNodeMutation, UpdateNodeMutationVariables>;
export const DeleteNodeByIdDocument = new TypedDocumentString(`
    mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {
  deleteNodeById(order: $order, parent_id: $parent_id, id: $id)
}
    `) as unknown as TypedDocumentString<DeleteNodeByIdMutation, DeleteNodeByIdMutationVariables>;
export const RegisterDocument = new TypedDocumentString(`
    mutation Register($data: Registration!) {
  register(data: $data)
}
    `) as unknown as TypedDocumentString<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = new TypedDocumentString(`
    mutation Login($data: Login!) {
  login(data: $data) {
    id
    token
    name
    email
  }
}
    `) as unknown as TypedDocumentString<LoginMutation, LoginMutationVariables>;