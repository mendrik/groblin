/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  query GetProject {\n    getProject {\n\t\tuser {\n\t\t\tid\n\t\t\temail\n\t\t\tname\t\n\t\t\tlastProjectId\n\t\t}\n\t\tproject {\n\t\t\tname\n\t\t}\n\t\tnodes {\n            ...Node\n        }\n\t\ttags {\n\t\t\tid\n\t\t\tname\n\t\t\tmaster\n\t\t\tparent_id\t\n\t\t}\n    }\n  }\n": types.GetProjectDocument,
    "\n  subscription TagsUpdated($lastProjectId: Int!) {\n\ttagsUpdated(lastProjectId: $lastProjectId)\n  }\n": types.TagsUpdatedDocument,
    "\n  query GetTags {\n    getTags {\n\t\tid\n        parent_id\n        name\n\t\tmaster\n    }\n  }\n": types.GetTagsDocument,
    "\n  mutation InsertTag($data: InsertTag!) {\n    insertTag(data: $data) {\n\t\tid\n\t\tname\n\t\tparent_id\n\t\tmaster\n\t}\n  }\n": types.InsertTagDocument,
    "\n  mutation UpdateTag($data: ChangeTagInput!) {\n    updateTag(data: $data)\n  }\n": types.UpdateTagDocument,
    "\n  mutation DeleteTagById($id: Int!) {\n    deleteTagById(id: $id)\n  }\n": types.DeleteTagByIdDocument,
    "\n  fragment Node on Node {\n\tid\n\tname\n\torder\n\ttype\n\ttag_id\n\tparent_id\n  }\n": types.NodeFragmentDoc,
    "\n  subscription NodesUpdated {\n\tnodesUpdated\n  }\n": types.NodesUpdatedDocument,
    "\n  query GetNodes {\n    getNodes {\n\t\t...Node\n    }\n  }\n": types.GetNodesDocument,
    "\n  mutation InsertNode($data: InsertNode!) {\n    insertNode(data: $data) {\n\t\tid\n\t}\n  }\n": types.InsertNodeDocument,
    "\n  mutation UpdateNode($data: ChangeNodeInput!) {\n    updateNode(data: $data)\n  }\n": types.UpdateNodeDocument,
    "\n  mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {\n    deleteNodeById(order: $order, parent_id: $parent_id, id: $id)\n  }\n": types.DeleteNodeByIdDocument,
    "\n  mutation Register($data: Registration!) {\n    register(data: $data)\n  }\n": types.RegisterDocument,
    "\n  mutation Login($data: Login!) {\n    login(data: $data) {\n\t\ttoken\n\t\texpiresDate\n\t}\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetProject {\n    getProject {\n\t\tuser {\n\t\t\tid\n\t\t\temail\n\t\t\tname\t\n\t\t\tlastProjectId\n\t\t}\n\t\tproject {\n\t\t\tname\n\t\t}\n\t\tnodes {\n            ...Node\n        }\n\t\ttags {\n\t\t\tid\n\t\t\tname\n\t\t\tmaster\n\t\t\tparent_id\t\n\t\t}\n    }\n  }\n"): typeof import('./graphql').GetProjectDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TagsUpdated($lastProjectId: Int!) {\n\ttagsUpdated(lastProjectId: $lastProjectId)\n  }\n"): typeof import('./graphql').TagsUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTags {\n    getTags {\n\t\tid\n        parent_id\n        name\n\t\tmaster\n    }\n  }\n"): typeof import('./graphql').GetTagsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InsertTag($data: InsertTag!) {\n    insertTag(data: $data) {\n\t\tid\n\t\tname\n\t\tparent_id\n\t\tmaster\n\t}\n  }\n"): typeof import('./graphql').InsertTagDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTag($data: ChangeTagInput!) {\n    updateTag(data: $data)\n  }\n"): typeof import('./graphql').UpdateTagDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTagById($id: Int!) {\n    deleteTagById(id: $id)\n  }\n"): typeof import('./graphql').DeleteTagByIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment Node on Node {\n\tid\n\tname\n\torder\n\ttype\n\ttag_id\n\tparent_id\n  }\n"): typeof import('./graphql').NodeFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NodesUpdated {\n\tnodesUpdated\n  }\n"): typeof import('./graphql').NodesUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetNodes {\n    getNodes {\n\t\t...Node\n    }\n  }\n"): typeof import('./graphql').GetNodesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InsertNode($data: InsertNode!) {\n    insertNode(data: $data) {\n\t\tid\n\t}\n  }\n"): typeof import('./graphql').InsertNodeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateNode($data: ChangeNodeInput!) {\n    updateNode(data: $data)\n  }\n"): typeof import('./graphql').UpdateNodeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {\n    deleteNodeById(order: $order, parent_id: $parent_id, id: $id)\n  }\n"): typeof import('./graphql').DeleteNodeByIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Register($data: Registration!) {\n    register(data: $data)\n  }\n"): typeof import('./graphql').RegisterDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($data: Login!) {\n    login(data: $data) {\n\t\ttoken\n\t\texpiresDate\n\t}\n  }\n"): typeof import('./graphql').LoginDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout\n  }\n"): typeof import('./graphql').LogoutDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
