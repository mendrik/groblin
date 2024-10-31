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
    "\n  subscription NodesUpdated {\n\tnodesUpdated\n  }\n": types.NodesUpdatedDocument,
    "\n  query GetNodes {\n    getNodes {\n\t\tid\n\t\tname\n\t\torder\n\t\ttype\n\t\tparent_id\n    }\n  }\n": types.GetNodesDocument,
    "\n  mutation InsertNode($data: InsertNode!) {\n    insertNode(data: $data) {\n\t\tid\n\t}\n  }\n": types.InsertNodeDocument,
    "\n  mutation UpdateNode($data: ChangeNodeInput!) {\n    updateNode(data: $data)\n  }\n": types.UpdateNodeDocument,
    "\n  mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {\n    deleteNodeById(order: $order, parent_id: $parent_id, id: $id)\n  }\n": types.DeleteNodeByIdDocument,
    "\n  mutation Register($data: Registration!) {\n    register(data: $data)\n  }\n": types.RegisterDocument,
    "\n  mutation Login($data: Login!) {\n    login(data: $data) {\n\t\ttoken\n\t\texpiresDate\n\t}\n  }\n": types.LoginDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NodesUpdated {\n\tnodesUpdated\n  }\n"): typeof import('./graphql').NodesUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetNodes {\n    getNodes {\n\t\tid\n\t\tname\n\t\torder\n\t\ttype\n\t\tparent_id\n    }\n  }\n"): typeof import('./graphql').GetNodesDocument;
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


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
