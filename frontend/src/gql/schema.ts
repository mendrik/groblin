export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: string; output: string; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: Record<string, any>; output: Record<string, any>; }
};

export type ApiKey = {
  created_at: Scalars['DateTimeISO']['output'];
  expires_at?: Maybe<Scalars['DateTimeISO']['output']>;
  is_active: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  last_used?: Maybe<Scalars['DateTimeISO']['output']>;
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
  emailError?: Maybe<Scalars['String']['output']>;
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
  list_path?: Maybe<Array<Scalars['Int']['output']>>;
  node_id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  revision: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['JSONObject']['output']>;
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
  height?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  width?: Maybe<Scalars['Int']['output']>;
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
  parent_id?: Maybe<Scalars['Int']['output']>;
  revision: Scalars['Int']['output'];
  type: NodeType;
};

export type NodeSettings = {
  id: Scalars['Int']['output'];
  node_id: Scalars['Int']['output'];
  revision: Scalars['Int']['output'];
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
  Root = 'root',
  String = 'string'
}

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
  accepted_at?: Maybe<Scalars['DateTimeISO']['output']>;
  created_at: Scalars['DateTimeISO']['output'];
  email: Scalars['String']['output'];
  expires_at: Scalars['DateTimeISO']['output'];
  id: Scalars['Int']['output'];
  revoked_at?: Maybe<Scalars['DateTimeISO']['output']>;
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
  current?: Maybe<Publication>;
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

export enum Role {
  Admin = 'Admin',
  Editor = 'Editor',
  Owner = 'Owner',
  Viewer = 'Viewer'
}

export type Subscription = {
  apiKeysUpdated: Scalars['Boolean']['output'];
  nodeSettingsUpdated: Scalars['Boolean']['output'];
  nodesUpdated: Scalars['Boolean']['output'];
  usersUpdated: Scalars['Boolean']['output'];
  valuesUpdated?: Maybe<Value>;
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
  list_path?: Maybe<Array<Scalars['Int']['output']>>;
  node_id: Scalars['Int']['output'];
  order: Scalars['Int']['output'];
  revision: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  value?: Maybe<Scalars['JSONObject']['output']>;
};

export type Workspace = {
  currentProject?: Maybe<ProjectMembership>;
  projects: Array<ProjectMembership>;
};
