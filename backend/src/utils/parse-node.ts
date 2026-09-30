import { assertExists } from '@shared/asserts.ts'
import type { Selectable } from 'kysely'
import { enum as enumSchema } from 'zod'
import type { Node as NodeRow } from '../database/schema.ts'
import type { Node } from '../gql/schema.ts'
import { NodeType } from '../types.ts'

const nodeType = enumSchema(NodeType)
export function parseNode(row: Selectable<NodeRow>): Node {
	assertExists(row.depth, 'Node depth is missing')
	return { ...row, type: nodeType.parse(row.type), depth: row.depth }
}
