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
    "\nsubscription GetNodes {     \n\tnode( order_by: { id: asc }) {\n\t\tid\n\t\tname\n\t\tnode_id\n\t\ttype\n\t\torder\n\t}\n}\n": types.GetNodesDocument,
    "\nmutation updateNodeName($id: Int!, $name: String!) {\n\tupdate_node_by_pk (\n\tpk_columns: { id: $id }\n\t_set: { name: $name }\n\t) { \n\t\tid\n\t}\n}\n": types.UpdateNodeNameDocument,
    "\nmutation deleteNode($id: Int!) {\n\tdelete_node_by_pk (\n\t\tid: $id\n\t) {\n\t\tid\n\t}\n}\n": types.DeleteNodeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nsubscription GetNodes {     \n\tnode( order_by: { id: asc }) {\n\t\tid\n\t\tname\n\t\tnode_id\n\t\ttype\n\t\torder\n\t}\n}\n"): typeof import('./graphql').GetNodesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nmutation updateNodeName($id: Int!, $name: String!) {\n\tupdate_node_by_pk (\n\tpk_columns: { id: $id }\n\t_set: { name: $name }\n\t) { \n\t\tid\n\t}\n}\n"): typeof import('./graphql').UpdateNodeNameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nmutation deleteNode($id: Int!) {\n\tdelete_node_by_pk (\n\t\tid: $id\n\t) {\n\t\tid\n\t}\n}\n"): typeof import('./graphql').DeleteNodeDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
