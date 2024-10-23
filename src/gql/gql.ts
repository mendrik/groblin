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
    "\nsubscription GetNodes {     \n\tnode( order_by: { order: asc }) {\n\t\tid\n\t\tname\n\t\tnode_id\n\t\ttype\n\t\torder\n\t}\n}\n": types.GetNodesDocument,
    "\nmutation updateNodeName($id: bigint!, $name: String!) {\n\tupdate_node_by_pk (\n\tpk_columns: { id: $id }\n\t_set: { name: $name }\n\t) { \n\t\tid\n\t}\n}\n": types.UpdateNodeNameDocument,
    "\nmutation deleteNode($id: bigint!, $parent_id: bigint!, $order: Int!) {\n\tdelete_node_by_pk (\n\t\tid: $id\n\t) {\n\t\tid\n\t}\n\n\tupdate_node(\n\t\twhere: { order: { _gte: $order }, node_id: { _eq: $parent_id } },\n\t\t_inc: { order: -1 }\n\t) {\n\t\taffected_rows\n\t}\n}\n": types.DeleteNodeDocument,
    "\nmutation insert_node($object: node_insert_input!, $parent_id: bigint!, $order: Int!) {\n\tupdate_node(\n\t\twhere: { order: { _gte: $order }, node_id: { _eq: $parent_id } },\n\t\t_inc: { order: 1 }\n\t) {\n\t\taffected_rows\n\t}\n\n  \tinsert_node_one(object: $object) {\n    \tid\n\t}\n}\n": types.Insert_NodeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nsubscription GetNodes {     \n\tnode( order_by: { order: asc }) {\n\t\tid\n\t\tname\n\t\tnode_id\n\t\ttype\n\t\torder\n\t}\n}\n"): typeof import('./graphql').GetNodesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nmutation updateNodeName($id: bigint!, $name: String!) {\n\tupdate_node_by_pk (\n\tpk_columns: { id: $id }\n\t_set: { name: $name }\n\t) { \n\t\tid\n\t}\n}\n"): typeof import('./graphql').UpdateNodeNameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nmutation deleteNode($id: bigint!, $parent_id: bigint!, $order: Int!) {\n\tdelete_node_by_pk (\n\t\tid: $id\n\t) {\n\t\tid\n\t}\n\n\tupdate_node(\n\t\twhere: { order: { _gte: $order }, node_id: { _eq: $parent_id } },\n\t\t_inc: { order: -1 }\n\t) {\n\t\taffected_rows\n\t}\n}\n"): typeof import('./graphql').DeleteNodeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\nmutation insert_node($object: node_insert_input!, $parent_id: bigint!, $order: Int!) {\n\tupdate_node(\n\t\twhere: { order: { _gte: $order }, node_id: { _eq: $parent_id } },\n\t\t_inc: { order: 1 }\n\t) {\n\t\taffected_rows\n\t}\n\n  \tinsert_node_one(object: $object) {\n    \tid\n\t}\n}\n"): typeof import('./graphql').Insert_NodeDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
