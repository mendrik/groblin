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
    "\n  query GetNodes {\n    get_nodes {\n\t\tid\n\t\tname\n\t\torder\n\t\ttype\n\t\tparent_id\n    }\n  }\n": types.GetNodesDocument,
    "\n  mutation InsertNode($data: InsertNode!) {\n    insert_node(data: $data)\n  }\n": types.InsertNodeDocument,
    "\n  mutation UpdateNode($data: ChangeNodeInput!) {\n    update_node(data: $data)\n  }\n": types.UpdateNodeDocument,
    "\n  mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {\n    delete_node_by_id(order: $order, parent_id: $parent_id, id: $id)\n  }\n": types.DeleteNodeByIdDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetNodes {\n    get_nodes {\n\t\tid\n\t\tname\n\t\torder\n\t\ttype\n\t\tparent_id\n    }\n  }\n"): typeof import('./graphql').GetNodesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InsertNode($data: InsertNode!) {\n    insert_node(data: $data)\n  }\n"): typeof import('./graphql').InsertNodeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateNode($data: ChangeNodeInput!) {\n    update_node(data: $data)\n  }\n"): typeof import('./graphql').UpdateNodeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNodeById($order: Int!, $parent_id: Int!, $id: Int!) {\n    delete_node_by_id(order: $order, parent_id: $parent_id, id: $id)\n  }\n"): typeof import('./graphql').DeleteNodeByIdDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
