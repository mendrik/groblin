import type { NodeType } from '../types.ts';
import type { Role } from '../types.ts';
import type { JsonValue } from '../database/schema.ts';
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { Context } from '../types.ts';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: Date; output: Date; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: Date; output: Date; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: JsonValue; output: JsonValue; }
};

export type ApiKey = {
  created_at: Scalars['DateTimeISO']['output'];
  expires_at: Maybe<Scalars['DateTimeISO']['output']>;
  is_active: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  last_used: Maybe<Scalars['DateTimeISO']['output']>;
  name: Scalars['String']['output'];
  preview: Scalars['Boolean']['output'];
};

export type ChangeNodeInput = {
  expectedRevision: Scalars['Int']['input'];
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  parent_id?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<NodeType>;
};

export type ContentRevision = {
  author_name: Scalars['String']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  id: Scalars['Int']['output'];
  summary: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type ContentRevisionDetail = {
  revision: ContentRevision;
  snapshot: Scalars['JSONObject']['output'];
};

export type CreateApiKey = {
  expires_at?: InputMaybe<Scalars['DateTimeISO']['input']>;
  name: Scalars['String']['input'];
  preview?: Scalars['Boolean']['input'];
};

export type CreatedInvitation = {
  emailError: Maybe<Scalars['String']['output']>;
  emailSent: Scalars['Boolean']['output'];
  invitation: ProjectInvitation;
  url: Scalars['String']['output'];
};

export type DeletionImpact = {
  fieldNames: Array<Scalars['String']['output']>;
  fields: Scalars['Int']['output'];
  fingerprint: Scalars['String']['output'];
  listItems: Scalars['Int']['output'];
  mediaFiles: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  values: Scalars['Int']['output'];
};

export enum DeletionKind {
  Node = 'NODE',
  NodeValues = 'NODE_VALUES',
  Value = 'VALUE'
}

export type DeletionTarget = {
  id: Scalars['Int']['input'];
  kind: DeletionKind;
};

export type GetValues = {
  ids: Array<Scalars['Int']['input']>;
};

export enum ImportKind {
  Array = 'ARRAY',
  Object = 'OBJECT'
}

export type ImportPreview = {
  fieldsAdded: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  source: Scalars['String']['output'];
  valuesAdded: Scalars['Int']['output'];
  valuesChanged: Scalars['Int']['output'];
  valuesRemoved: Scalars['Int']['output'];
  version: Scalars['Int']['output'];
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

export type InvitationPreview = {
  accepted: Scalars['Boolean']['output'];
  email: Scalars['String']['output'];
  expires_at: Scalars['DateTimeISO']['output'];
  project_name: Scalars['String']['output'];
  role: Role;
};

export type Invite = {
  email: Scalars['String']['input'];
  role?: Role;
};

export type JsonArrayImportInput = {
  data: Scalars['String']['input'];
  external_id?: InputMaybe<Scalars['String']['input']>;
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  node_id: Scalars['Int']['input'];
  structure: Scalars['Boolean']['input'];
};

export type ListFilter = {
  node_id: Scalars['Int']['input'];
  operator: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type ListItem = {
  children: Array<Value>;
  id: Scalars['Int']['output'];
  list_path: Maybe<Array<Scalars['Int']['output']>>;
  node_id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  revision: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  value: Maybe<Scalars['JSONObject']['output']>;
};

export type ListPage = {
  items: Array<ListItem>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ListRequest = {
  direction?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Array<ListFilter>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  node_id: Scalars['Int']['input'];
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort_node_id?: InputMaybe<Scalars['Int']['input']>;
};

export type MediaMetadata = {
  contentType: Scalars['String']['output'];
  file: Scalars['String']['output'];
  height: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  width: Maybe<Scalars['Int']['output']>;
};

export type Mutation = {
  acceptInvitation: Scalars['Int']['output'];
  createApiKey: ApiKey;
  createProject: Scalars['Int']['output'];
  deleteApiKey: Scalars['Boolean']['output'];
  deleteListItem: Scalars['Boolean']['output'];
  deleteNodeById: Scalars['Boolean']['output'];
  deleteProject: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  deleteValue: Scalars['Boolean']['output'];
  exportProject: ProjectExport;
  finalizeUpload: MediaMetadata;
  importArray: Scalars['Boolean']['output'];
  importObject: Scalars['Boolean']['output'];
  importProjectArchive: Scalars['Int']['output'];
  insertListItem: Scalars['Int']['output'];
  insertNode: Node;
  inviteUser: CreatedInvitation;
  publishContent: Publication;
  renameProject: Scalars['Int']['output'];
  restoreContentRevision: Scalars['Int']['output'];
  revokeInvitation: Scalars['Boolean']['output'];
  switchProject: Scalars['Boolean']['output'];
  toggleApiKey: Scalars['Boolean']['output'];
  transferProjectOwnership: Scalars['Boolean']['output'];
  truncate: Scalars['Boolean']['output'];
  updateNode: Node;
  updateUserRole: Scalars['Boolean']['output'];
  uploadUrl: Upload;
  upsertNodeSettings: NodeSettings;
  upsertValue: Value;
};


export type MutationAcceptInvitationArgs = {
  token: Scalars['String']['input'];
};


export type MutationCreateApiKeyArgs = {
  data: CreateApiKey;
};


export type MutationCreateProjectArgs = {
  name: Scalars['String']['input'];
};


export type MutationDeleteApiKeyArgs = {
  key: Scalars['String']['input'];
};


export type MutationDeleteListItemArgs = {
  expectedImpact: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationDeleteNodeByIdArgs = {
  expectedImpact: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  order: Scalars['Int']['input'];
  parent_id: Scalars['Int']['input'];
};


export type MutationDeleteProjectArgs = {
  confirmation: Scalars['String']['input'];
  expectedVersion: Scalars['Int']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteValueArgs = {
  expectedImpact: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationFinalizeUploadArgs = {
  key: Scalars['String']['input'];
};


export type MutationImportArrayArgs = {
  data: JsonArrayImportInput;
  expectedSource: Scalars['String']['input'];
  expectedVersion: Scalars['Int']['input'];
};


export type MutationImportObjectArgs = {
  data: JsonArrayImportInput;
  expectedSource: Scalars['String']['input'];
  expectedVersion: Scalars['Int']['input'];
};


export type MutationImportProjectArchiveArgs = {
  expectedSource: Scalars['String']['input'];
  key: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationInsertListItemArgs = {
  listItem: InsertListItem;
};


export type MutationInsertNodeArgs = {
  data: InsertNode;
  settings?: InputMaybe<Scalars['JSONObject']['input']>;
};


export type MutationInviteUserArgs = {
  data: Invite;
};


export type MutationPublishContentArgs = {
  expectedPublication: Scalars['Int']['input'];
  expectedVersion: Scalars['Int']['input'];
  revisionId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationRenameProjectArgs = {
  expectedVersion: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationRestoreContentRevisionArgs = {
  expectedVersion: Scalars['Int']['input'];
  id: Scalars['Int']['input'];
};


export type MutationRevokeInvitationArgs = {
  id: Scalars['Int']['input'];
};


export type MutationSwitchProjectArgs = {
  id: Scalars['Int']['input'];
};


export type MutationToggleApiKeyArgs = {
  key: Scalars['String']['input'];
};


export type MutationTransferProjectOwnershipArgs = {
  userId: Scalars['String']['input'];
};


export type MutationTruncateArgs = {
  data: TruncateValue;
};


export type MutationUpdateNodeArgs = {
  data: ChangeNodeInput;
};


export type MutationUpdateUserRoleArgs = {
  expectedRole: Role;
  id: Scalars['String']['input'];
  role: Role;
};


export type MutationUploadUrlArgs = {
  data: UploadInput;
};


export type MutationUpsertNodeSettingsArgs = {
  data: UpsertNodeSettings;
};


export type MutationUpsertValueArgs = {
  data: UpsertValue;
};

export type Node = {
  depth: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  parent_id: Maybe<Scalars['Int']['output']>;
  revision: Scalars['Int']['output'];
  type: NodeType;
};

export type NodeSettings = {
  id: Scalars['Int']['output'];
  node_id: Scalars['Int']['output'];
  revision: Scalars['Int']['output'];
  settings: Scalars['JSONObject']['output'];
};

export { NodeType };

export type Project = {
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type ProjectData = {
  nodeSettings: Array<NodeSettings>;
  nodes: Array<Node>;
  project: Project;
  values: Array<Value>;
};

export type ProjectExport = {
  bytes: Scalars['Int']['output'];
  filename: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type ProjectImportPreview = {
  fields: Scalars['Int']['output'];
  mediaBytes: Scalars['Int']['output'];
  mediaFiles: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  source: Scalars['String']['output'];
  values: Scalars['Int']['output'];
};

export type ProjectInvitation = {
  accepted_at: Maybe<Scalars['DateTimeISO']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  email: Scalars['String']['output'];
  expires_at: Scalars['DateTimeISO']['output'];
  id: Scalars['Int']['output'];
  revoked_at: Maybe<Scalars['DateTimeISO']['output']>;
  role: Role;
};

export type ProjectMembership = {
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  role: Role;
  version: Scalars['Int']['output'];
};

export type ProjectUser = {
  confirmed: Scalars['Boolean']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  owner: Scalars['Boolean']['output'];
  role: Role;
  roles: Array<Scalars['String']['output']>;
};

export type Publication = {
  author_name: Scalars['String']['output'];
  created_at: Scalars['DateTimeISO']['output'];
  id: Scalars['Int']['output'];
  revision_id: Scalars['Int']['output'];
  summary: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type PublicationState = {
  current: Maybe<Publication>;
  draftVersion: Scalars['Int']['output'];
  history: Array<Publication>;
};

export type Query = {
  getApiKeys: Array<ApiKey>;
  getContentRevision: ContentRevisionDetail;
  getContentRevisions: Array<ContentRevision>;
  getDeletionImpact: DeletionImpact;
  getInvitation: InvitationPreview;
  getInvitations: Array<ProjectInvitation>;
  getListColumns: Array<Node>;
  getListItems: Array<ListItem>;
  getListPage: ListPage;
  getNodeSettings: Array<NodeSettings>;
  getNodes: Array<Node>;
  getProject: ProjectData;
  getPublication: PublicationState;
  getUsers: Array<ProjectUser>;
  getValues: Array<Value>;
  getWorkspace: Workspace;
  previewImport: ImportPreview;
  previewProjectImport: ProjectImportPreview;
};


export type QueryGetContentRevisionArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetContentRevisionsArgs = {
  before?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetDeletionImpactArgs = {
  target: DeletionTarget;
};


export type QueryGetInvitationArgs = {
  token: Scalars['String']['input'];
};


export type QueryGetListColumnsArgs = {
  node_id: Scalars['Int']['input'];
};


export type QueryGetListItemsArgs = {
  request: ListRequest;
};


export type QueryGetListPageArgs = {
  request: ListRequest;
};


export type QueryGetValuesArgs = {
  data: GetValues;
};


export type QueryPreviewImportArgs = {
  data: JsonArrayImportInput;
  kind: ImportKind;
};


export type QueryPreviewProjectImportArgs = {
  key: Scalars['String']['input'];
};

export { Role };

export type Subscription = {
  apiKeysUpdated: Scalars['Boolean']['output'];
  nodeSettingsUpdated: Scalars['Boolean']['output'];
  nodesUpdated: Scalars['Boolean']['output'];
  usersUpdated: Scalars['Boolean']['output'];
  valuesUpdated: Maybe<Value>;
  workspaceUpdated: Scalars['Boolean']['output'];
};

export type TruncateValue = {
  expectedImpact: Scalars['String']['input'];
  node_id: Scalars['Int']['input'];
};

export type Upload = {
  object: Scalars['String']['output'];
  signedUrl: Scalars['String']['output'];
};

export type UploadInput = {
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  purpose: Scalars['String']['input'];
  size: Scalars['Int']['input'];
};

export type UpsertNodeSettings = {
  expectedRevision: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  node_id: Scalars['Int']['input'];
  settings: Scalars['JSONObject']['input'];
};

export type UpsertValue = {
  expectedRevision: Scalars['Int']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  list_path?: InputMaybe<Array<Scalars['Int']['input']>>;
  node_id: Scalars['Int']['input'];
  value: Scalars['JSONObject']['input'];
};

export type Value = {
  id: Scalars['Int']['output'];
  list_path: Maybe<Array<Scalars['Int']['output']>>;
  node_id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  revision: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  value: Maybe<Scalars['JSONObject']['output']>;
};

export type Workspace = {
  currentProject: Maybe<ProjectMembership>;
  projects: Array<ProjectMembership>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;

export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ApiKey: ResolverTypeWrapper<ApiKey>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ChangeNodeInput: ChangeNodeInput;
  ContentRevision: ResolverTypeWrapper<ContentRevision>;
  ContentRevisionDetail: ResolverTypeWrapper<ContentRevisionDetail>;
  CreateApiKey: CreateApiKey;
  CreatedInvitation: ResolverTypeWrapper<CreatedInvitation>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DateTimeISO: ResolverTypeWrapper<Scalars['DateTimeISO']['output']>;
  DeletionImpact: ResolverTypeWrapper<DeletionImpact>;
  DeletionKind: DeletionKind;
  DeletionTarget: DeletionTarget;
  GetValues: GetValues;
  ImportKind: ImportKind;
  ImportPreview: ResolverTypeWrapper<ImportPreview>;
  InsertListItem: InsertListItem;
  InsertNode: InsertNode;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InvitationPreview: ResolverTypeWrapper<InvitationPreview>;
  Invite: Invite;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']['output']>;
  JsonArrayImportInput: JsonArrayImportInput;
  ListFilter: ListFilter;
  ListItem: ResolverTypeWrapper<ListItem>;
  ListPage: ResolverTypeWrapper<ListPage>;
  ListRequest: ListRequest;
  MediaMetadata: ResolverTypeWrapper<MediaMetadata>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Node: ResolverTypeWrapper<Node>;
  NodeSettings: ResolverTypeWrapper<NodeSettings>;
  NodeType: NodeType;
  Project: ResolverTypeWrapper<Project>;
  ProjectData: ResolverTypeWrapper<ProjectData>;
  ProjectExport: ResolverTypeWrapper<ProjectExport>;
  ProjectImportPreview: ResolverTypeWrapper<ProjectImportPreview>;
  ProjectInvitation: ResolverTypeWrapper<ProjectInvitation>;
  ProjectMembership: ResolverTypeWrapper<ProjectMembership>;
  ProjectUser: ResolverTypeWrapper<ProjectUser>;
  Publication: ResolverTypeWrapper<Publication>;
  PublicationState: ResolverTypeWrapper<PublicationState>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Role: Role;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  TruncateValue: TruncateValue;
  Upload: ResolverTypeWrapper<Upload>;
  UploadInput: UploadInput;
  UpsertNodeSettings: UpsertNodeSettings;
  UpsertValue: UpsertValue;
  Value: ResolverTypeWrapper<Value>;
  Workspace: ResolverTypeWrapper<Workspace>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ApiKey: ApiKey;
  Boolean: Scalars['Boolean']['output'];
  ChangeNodeInput: ChangeNodeInput;
  ContentRevision: ContentRevision;
  ContentRevisionDetail: ContentRevisionDetail;
  CreateApiKey: CreateApiKey;
  CreatedInvitation: CreatedInvitation;
  DateTime: Scalars['DateTime']['output'];
  DateTimeISO: Scalars['DateTimeISO']['output'];
  DeletionImpact: DeletionImpact;
  DeletionTarget: DeletionTarget;
  GetValues: GetValues;
  ImportPreview: ImportPreview;
  InsertListItem: InsertListItem;
  InsertNode: InsertNode;
  Int: Scalars['Int']['output'];
  InvitationPreview: InvitationPreview;
  Invite: Invite;
  JSONObject: Scalars['JSONObject']['output'];
  JsonArrayImportInput: JsonArrayImportInput;
  ListFilter: ListFilter;
  ListItem: ListItem;
  ListPage: ListPage;
  ListRequest: ListRequest;
  MediaMetadata: MediaMetadata;
  Mutation: Record<PropertyKey, never>;
  Node: Node;
  NodeSettings: NodeSettings;
  Project: Project;
  ProjectData: ProjectData;
  ProjectExport: ProjectExport;
  ProjectImportPreview: ProjectImportPreview;
  ProjectInvitation: ProjectInvitation;
  ProjectMembership: ProjectMembership;
  ProjectUser: ProjectUser;
  Publication: Publication;
  PublicationState: PublicationState;
  Query: Record<PropertyKey, never>;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  TruncateValue: TruncateValue;
  Upload: Upload;
  UploadInput: UploadInput;
  UpsertNodeSettings: UpsertNodeSettings;
  UpsertValue: UpsertValue;
  Value: Value;
  Workspace: Workspace;
};

export type ApiKeyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = {
  created_at?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>;
  expires_at?: Resolver<Maybe<ResolversTypes['DateTimeISO']>, ParentType, ContextType>;
  is_active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  last_used?: Resolver<Maybe<ResolversTypes['DateTimeISO']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  preview?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type ContentRevisionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContentRevision'] = ResolversParentTypes['ContentRevision']> = {
  author_name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ContentRevisionDetailResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ContentRevisionDetail'] = ResolversParentTypes['ContentRevisionDetail']> = {
  revision?: Resolver<ResolversTypes['ContentRevision'], ParentType, ContextType>;
  snapshot?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
};

export type CreatedInvitationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CreatedInvitation'] = ResolversParentTypes['CreatedInvitation']> = {
  emailError?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  emailSent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  invitation?: Resolver<ResolversTypes['ProjectInvitation'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface DateTimeIsoScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTimeISO'], any> {
  name: 'DateTimeISO';
}

export type DeletionImpactResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DeletionImpact'] = ResolversParentTypes['DeletionImpact']> = {
  fieldNames?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  fields?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fingerprint?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  listItems?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  mediaFiles?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ImportPreviewResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ImportPreview'] = ResolversParentTypes['ImportPreview']> = {
  fieldsAdded?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  valuesAdded?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  valuesChanged?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  valuesRemoved?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type InvitationPreviewResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InvitationPreview'] = ResolversParentTypes['InvitationPreview']> = {
  accepted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expires_at?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>;
  project_name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
};

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export type ListItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ListItem'] = ResolversParentTypes['ListItem']> = {
  children?: Resolver<Array<ResolversTypes['Value']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  list_path?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  node_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revision?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
};

export type ListPageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ListPage'] = ResolversParentTypes['ListPage']> = {
  items?: Resolver<Array<ResolversTypes['ListItem']>, ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MediaMetadataResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MediaMetadata'] = ResolversParentTypes['MediaMetadata']> = {
  contentType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  file?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  height?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  width?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  acceptInvitation?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationAcceptInvitationArgs, 'token'>>;
  createApiKey?: Resolver<ResolversTypes['ApiKey'], ParentType, ContextType, RequireFields<MutationCreateApiKeyArgs, 'data'>>;
  createProject?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationCreateProjectArgs, 'name'>>;
  deleteApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteApiKeyArgs, 'key'>>;
  deleteListItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteListItemArgs, 'expectedImpact' | 'id'>>;
  deleteNodeById?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteNodeByIdArgs, 'expectedImpact' | 'id' | 'order' | 'parent_id'>>;
  deleteProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProjectArgs, 'confirmation' | 'expectedVersion'>>;
  deleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  deleteValue?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteValueArgs, 'expectedImpact' | 'id'>>;
  exportProject?: Resolver<ResolversTypes['ProjectExport'], ParentType, ContextType>;
  finalizeUpload?: Resolver<ResolversTypes['MediaMetadata'], ParentType, ContextType, RequireFields<MutationFinalizeUploadArgs, 'key'>>;
  importArray?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationImportArrayArgs, 'data' | 'expectedSource' | 'expectedVersion'>>;
  importObject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationImportObjectArgs, 'data' | 'expectedSource' | 'expectedVersion'>>;
  importProjectArchive?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationImportProjectArchiveArgs, 'expectedSource' | 'key' | 'name'>>;
  insertListItem?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationInsertListItemArgs, 'listItem'>>;
  insertNode?: Resolver<ResolversTypes['Node'], ParentType, ContextType, RequireFields<MutationInsertNodeArgs, 'data'>>;
  inviteUser?: Resolver<ResolversTypes['CreatedInvitation'], ParentType, ContextType, RequireFields<MutationInviteUserArgs, 'data'>>;
  publishContent?: Resolver<ResolversTypes['Publication'], ParentType, ContextType, RequireFields<MutationPublishContentArgs, 'expectedPublication' | 'expectedVersion'>>;
  renameProject?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationRenameProjectArgs, 'expectedVersion' | 'name'>>;
  restoreContentRevision?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationRestoreContentRevisionArgs, 'expectedVersion' | 'id'>>;
  revokeInvitation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRevokeInvitationArgs, 'id'>>;
  switchProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSwitchProjectArgs, 'id'>>;
  toggleApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationToggleApiKeyArgs, 'key'>>;
  transferProjectOwnership?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationTransferProjectOwnershipArgs, 'userId'>>;
  truncate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationTruncateArgs, 'data'>>;
  updateNode?: Resolver<ResolversTypes['Node'], ParentType, ContextType, RequireFields<MutationUpdateNodeArgs, 'data'>>;
  updateUserRole?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateUserRoleArgs, 'expectedRole' | 'id' | 'role'>>;
  uploadUrl?: Resolver<ResolversTypes['Upload'], ParentType, ContextType, RequireFields<MutationUploadUrlArgs, 'data'>>;
  upsertNodeSettings?: Resolver<ResolversTypes['NodeSettings'], ParentType, ContextType, RequireFields<MutationUpsertNodeSettingsArgs, 'data'>>;
  upsertValue?: Resolver<ResolversTypes['Value'], ParentType, ContextType, RequireFields<MutationUpsertValueArgs, 'data'>>;
};

export type NodeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node']> = {
  depth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  parent_id?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  revision?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['NodeType'], ParentType, ContextType>;
};

export type NodeSettingsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['NodeSettings'] = ResolversParentTypes['NodeSettings']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  node_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revision?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
};

export type NodeTypeResolvers = EnumResolverSignature<{ article?: any, boolean?: any, choice?: any, color?: any, date?: any, list?: any, media?: any, number?: any, object?: any, root?: any, string?: any }, ResolversTypes['NodeType']>;

export type ProjectResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProjectDataResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProjectData'] = ResolversParentTypes['ProjectData']> = {
  nodeSettings?: Resolver<Array<ResolversTypes['NodeSettings']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Node']>, ParentType, ContextType>;
  project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  values?: Resolver<Array<ResolversTypes['Value']>, ParentType, ContextType>;
};

export type ProjectExportResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProjectExport'] = ResolversParentTypes['ProjectExport']> = {
  bytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ProjectImportPreviewResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProjectImportPreview'] = ResolversParentTypes['ProjectImportPreview']> = {
  fields?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  mediaBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  mediaFiles?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProjectInvitationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProjectInvitation'] = ResolversParentTypes['ProjectInvitation']> = {
  accepted_at?: Resolver<Maybe<ResolversTypes['DateTimeISO']>, ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expires_at?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revoked_at?: Resolver<Maybe<ResolversTypes['DateTimeISO']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
};

export type ProjectMembershipResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProjectMembership'] = ResolversParentTypes['ProjectMembership']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProjectUserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProjectUser'] = ResolversParentTypes['ProjectUser']> = {
  confirmed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PublicationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Publication'] = ResolversParentTypes['Publication']> = {
  author_name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes['DateTimeISO'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revision_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type PublicationStateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PublicationState'] = ResolversParentTypes['PublicationState']> = {
  current?: Resolver<Maybe<ResolversTypes['Publication']>, ParentType, ContextType>;
  draftVersion?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  history?: Resolver<Array<ResolversTypes['Publication']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getApiKeys?: Resolver<Array<ResolversTypes['ApiKey']>, ParentType, ContextType>;
  getContentRevision?: Resolver<ResolversTypes['ContentRevisionDetail'], ParentType, ContextType, RequireFields<QueryGetContentRevisionArgs, 'id'>>;
  getContentRevisions?: Resolver<Array<ResolversTypes['ContentRevision']>, ParentType, ContextType, RequireFields<QueryGetContentRevisionsArgs, 'limit'>>;
  getDeletionImpact?: Resolver<ResolversTypes['DeletionImpact'], ParentType, ContextType, RequireFields<QueryGetDeletionImpactArgs, 'target'>>;
  getInvitation?: Resolver<ResolversTypes['InvitationPreview'], ParentType, ContextType, RequireFields<QueryGetInvitationArgs, 'token'>>;
  getInvitations?: Resolver<Array<ResolversTypes['ProjectInvitation']>, ParentType, ContextType>;
  getListColumns?: Resolver<Array<ResolversTypes['Node']>, ParentType, ContextType, RequireFields<QueryGetListColumnsArgs, 'node_id'>>;
  getListItems?: Resolver<Array<ResolversTypes['ListItem']>, ParentType, ContextType, RequireFields<QueryGetListItemsArgs, 'request'>>;
  getListPage?: Resolver<ResolversTypes['ListPage'], ParentType, ContextType, RequireFields<QueryGetListPageArgs, 'request'>>;
  getNodeSettings?: Resolver<Array<ResolversTypes['NodeSettings']>, ParentType, ContextType>;
  getNodes?: Resolver<Array<ResolversTypes['Node']>, ParentType, ContextType>;
  getProject?: Resolver<ResolversTypes['ProjectData'], ParentType, ContextType>;
  getPublication?: Resolver<ResolversTypes['PublicationState'], ParentType, ContextType>;
  getUsers?: Resolver<Array<ResolversTypes['ProjectUser']>, ParentType, ContextType>;
  getValues?: Resolver<Array<ResolversTypes['Value']>, ParentType, ContextType, RequireFields<QueryGetValuesArgs, 'data'>>;
  getWorkspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  previewImport?: Resolver<ResolversTypes['ImportPreview'], ParentType, ContextType, RequireFields<QueryPreviewImportArgs, 'data' | 'kind'>>;
  previewProjectImport?: Resolver<ResolversTypes['ProjectImportPreview'], ParentType, ContextType, RequireFields<QueryPreviewProjectImportArgs, 'key'>>;
};

export type RoleResolvers = EnumResolverSignature<{ Admin?: any, Editor?: any, Owner?: any, Viewer?: any }, ResolversTypes['Role']>;

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  apiKeysUpdated?: SubscriptionResolver<ResolversTypes['Boolean'], "apiKeysUpdated", ParentType, ContextType>;
  nodeSettingsUpdated?: SubscriptionResolver<ResolversTypes['Boolean'], "nodeSettingsUpdated", ParentType, ContextType>;
  nodesUpdated?: SubscriptionResolver<ResolversTypes['Boolean'], "nodesUpdated", ParentType, ContextType>;
  usersUpdated?: SubscriptionResolver<ResolversTypes['Boolean'], "usersUpdated", ParentType, ContextType>;
  valuesUpdated?: SubscriptionResolver<Maybe<ResolversTypes['Value']>, "valuesUpdated", ParentType, ContextType>;
  workspaceUpdated?: SubscriptionResolver<ResolversTypes['Boolean'], "workspaceUpdated", ParentType, ContextType>;
};

export type UploadResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Upload'] = ResolversParentTypes['Upload']> = {
  object?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  signedUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ValueResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Value'] = ResolversParentTypes['Value']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  list_path?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  node_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revision?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
};

export type WorkspaceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']> = {
  currentProject?: Resolver<Maybe<ResolversTypes['ProjectMembership']>, ParentType, ContextType>;
  projects?: Resolver<Array<ResolversTypes['ProjectMembership']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  ApiKey?: ApiKeyResolvers<ContextType>;
  ContentRevision?: ContentRevisionResolvers<ContextType>;
  ContentRevisionDetail?: ContentRevisionDetailResolvers<ContextType>;
  CreatedInvitation?: CreatedInvitationResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  DateTimeISO?: GraphQLScalarType;
  DeletionImpact?: DeletionImpactResolvers<ContextType>;
  ImportPreview?: ImportPreviewResolvers<ContextType>;
  InvitationPreview?: InvitationPreviewResolvers<ContextType>;
  JSONObject?: GraphQLScalarType;
  ListItem?: ListItemResolvers<ContextType>;
  ListPage?: ListPageResolvers<ContextType>;
  MediaMetadata?: MediaMetadataResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  NodeSettings?: NodeSettingsResolvers<ContextType>;
  NodeType?: NodeTypeResolvers;
  Project?: ProjectResolvers<ContextType>;
  ProjectData?: ProjectDataResolvers<ContextType>;
  ProjectExport?: ProjectExportResolvers<ContextType>;
  ProjectImportPreview?: ProjectImportPreviewResolvers<ContextType>;
  ProjectInvitation?: ProjectInvitationResolvers<ContextType>;
  ProjectMembership?: ProjectMembershipResolvers<ContextType>;
  ProjectUser?: ProjectUserResolvers<ContextType>;
  Publication?: PublicationResolvers<ContextType>;
  PublicationState?: PublicationStateResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Role?: RoleResolvers;
  Subscription?: SubscriptionResolvers<ContextType>;
  Upload?: UploadResolvers<ContextType>;
  Value?: ValueResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
};

