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

export type ChangeTagInput = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parent_id?: InputMaybe<Scalars['Int']['input']>;
};

export type InsertNode = {
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  parent_id?: InputMaybe<Scalars['Int']['input']>;
  type: NodeType;
};

export type InsertTag = {
  name: Scalars['String']['input'];
  parent_id?: InputMaybe<Scalars['Int']['input']>;
};

export type LoggedInUser = {
  __typename?: 'LoggedInUser';
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
  __typename?: 'Mutation';
  deleteNodeById: Scalars['Boolean']['output'];
  deleteTagById: Scalars['Boolean']['output'];
  insertNode: Node;
  insertTag: Tag;
  login: Token;
  logout: Scalars['Boolean']['output'];
  register: Scalars['Boolean']['output'];
  updateNode: Scalars['Boolean']['output'];
  updateTag: Scalars['Boolean']['output'];
};


export type MutationDeleteNodeByIdArgs = {
  id: Scalars['Int']['input'];
  order: Scalars['Int']['input'];
  parent_id: Scalars['Int']['input'];
};


export type MutationDeleteTagByIdArgs = {
  id: Scalars['Int']['input'];
};


export type MutationInsertNodeArgs = {
  data: InsertNode;
};


export type MutationInsertTagArgs = {
  data: InsertTag;
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


export type MutationUpdateTagArgs = {
  data: ChangeTagInput;
};

export type Node = {
  __typename?: 'Node';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  parent_id?: Maybe<Scalars['Int']['output']>;
  tag_id: Scalars['Int']['output'];
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
  __typename?: 'Project';
  nodes: Array<Node>;
  tags: Array<Tag>;
};

export type Query = {
  __typename?: 'Query';
  getNodes: Array<Node>;
  getProject: Project;
  getTags: Array<Tag>;
  whoami?: Maybe<LoggedInUser>;
};

export type Registration = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  nodesUpdated: Scalars['Boolean']['output'];
  tagsUpdated: Scalars['Boolean']['output'];
};

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['Int']['output'];
  master: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  parent_id?: Maybe<Scalars['Int']['output']>;
};

export type Token = {
  __typename?: 'Token';
  expiresDate: Scalars['DateTimeISO']['output'];
  token: Scalars['String']['output'];
};

export type GetProjectQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProjectQuery = { __typename?: 'Query', getProject: { __typename?: 'Project', nodes: Array<(
      { __typename?: 'Node' }
      & { ' $fragmentRefs'?: { 'NodeFragment': NodeFragment } }
    )>, tags: Array<{ __typename?: 'Tag', id: number, name: string, master: boolean, parent_id?: number | null }> } };

export type TagsUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type TagsUpdatedSubscription = { __typename?: 'Subscription', tagsUpdated: boolean };

export type GetTagsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTagsQuery = { __typename?: 'Query', getTags: Array<{ __typename?: 'Tag', id: number, parent_id?: number | null, name: string }> };

export type InsertTagMutationVariables = Exact<{
  data: InsertTag;
}>;


export type InsertTagMutation = { __typename?: 'Mutation', insertTag: { __typename?: 'Tag', id: number, name: string, parent_id?: number | null } };

export type UpdateTagMutationVariables = Exact<{
  data: ChangeTagInput;
}>;


export type UpdateTagMutation = { __typename?: 'Mutation', updateTag: boolean };

export type DeleteTagByIdMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteTagByIdMutation = { __typename?: 'Mutation', deleteTagById: boolean };

export type NodeFragment = { __typename?: 'Node', id: number, name: string, order: number, type: NodeType, tag_id: number, parent_id?: number | null } & { ' $fragmentName'?: 'NodeFragment' };

export type NodesUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NodesUpdatedSubscription = { __typename?: 'Subscription', nodesUpdated: boolean };

export type GetNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodesQuery = { __typename?: 'Query', getNodes: Array<(
    { __typename?: 'Node' }
    & { ' $fragmentRefs'?: { 'NodeFragment': NodeFragment } }
  )> };

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

export type WhoAmIQueryVariables = Exact<{ [key: string]: never; }>;


export type WhoAmIQuery = { __typename?: 'Query', whoami?: { __typename?: 'LoggedInUser', id: number, email: string, name: string } | null };

export type LoginMutationVariables = Exact<{
  data: Login;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'Token', token: string, expiresDate: any } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

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
export const NodeFragmentDoc = new TypedDocumentString(`
    fragment Node on Node {
  id
  name
  order
  type
  tag_id
  parent_id
}
    `, {"fragmentName":"Node"}) as unknown as TypedDocumentString<NodeFragment, unknown>;
export const GetProjectDocument = new TypedDocumentString(`
    query GetProject {
  getProject {
    nodes {
      ...Node
    }
    tags {
      id
      name
      master
      parent_id
    }
  }
}
    fragment Node on Node {
  id
  name
  order
  type
  tag_id
  parent_id
}`) as unknown as TypedDocumentString<GetProjectQuery, GetProjectQueryVariables>;
export const TagsUpdatedDocument = new TypedDocumentString(`
    subscription TagsUpdated {
  tagsUpdated
}
    `) as unknown as TypedDocumentString<TagsUpdatedSubscription, TagsUpdatedSubscriptionVariables>;
export const GetTagsDocument = new TypedDocumentString(`
    query GetTags {
  getTags {
    id
    parent_id
    name
  }
}
    `) as unknown as TypedDocumentString<GetTagsQuery, GetTagsQueryVariables>;
export const InsertTagDocument = new TypedDocumentString(`
    mutation InsertTag($data: InsertTag!) {
  insertTag(data: $data) {
    id
    name
    parent_id
  }
}
    `) as unknown as TypedDocumentString<InsertTagMutation, InsertTagMutationVariables>;
export const UpdateTagDocument = new TypedDocumentString(`
    mutation UpdateTag($data: ChangeTagInput!) {
  updateTag(data: $data)
}
    `) as unknown as TypedDocumentString<UpdateTagMutation, UpdateTagMutationVariables>;
export const DeleteTagByIdDocument = new TypedDocumentString(`
    mutation DeleteTagById($id: Int!) {
  deleteTagById(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteTagByIdMutation, DeleteTagByIdMutationVariables>;
export const NodesUpdatedDocument = new TypedDocumentString(`
    subscription NodesUpdated {
  nodesUpdated
}
    `) as unknown as TypedDocumentString<NodesUpdatedSubscription, NodesUpdatedSubscriptionVariables>;
export const GetNodesDocument = new TypedDocumentString(`
    query GetNodes {
  getNodes {
    ...Node
  }
}
    fragment Node on Node {
  id
  name
  order
  type
  tag_id
  parent_id
}`) as unknown as TypedDocumentString<GetNodesQuery, GetNodesQueryVariables>;
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
export const WhoAmIDocument = new TypedDocumentString(`
    query WhoAmI {
  whoami {
    id
    email
    name
  }
}
    `) as unknown as TypedDocumentString<WhoAmIQuery, WhoAmIQueryVariables>;
export const LoginDocument = new TypedDocumentString(`
    mutation Login($data: Login!) {
  login(data: $data) {
    token
    expiresDate
  }
}
    `) as unknown as TypedDocumentString<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = new TypedDocumentString(`
    mutation Logout {
  logout
}
    `) as unknown as TypedDocumentString<LogoutMutation, LogoutMutationVariables>;