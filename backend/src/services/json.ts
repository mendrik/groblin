import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { eqBy, isNil, mergeAll, toLower } from 'ramda'
import {
	isBoolean,
	isNumber,
	isObject,
	isPrimitive,
	isString
} from 'ramda-adjunct'
import type { Json, JsonArray } from 'src/database/schema.ts'
import { NodeType } from 'src/enums.ts'
import type { Node as DbNode } from 'src/resolvers/node-resolver.ts'
import { color } from 'src/utils/color-codec.ts'
import { date } from 'src/utils/date-codec.ts'

export type Difference = {
	key: string
	parent: Node
	type: NodeType
}

type Node = TreeOf<DbNode, 'nodes'>

function* noop() {}

const isObjOrArray = (n: Node): n is Node =>
	n.type === NodeType.object || n.type === NodeType.list

const isPrimitiveArray = (
	json: unknown
): json is Array<string | number | boolean> =>
	Array.isArray(json) && json.every(isPrimitive)

const isObjectArray = (json: unknown): json is Array<object> =>
	Array.isArray(json) && json.every(isObject)

const isColorString = (json: unknown): json is string =>
	color.safeParse(json).success

const isDate = (json: unknown): json is string => date.safeParse(json).success

const primitiveName = (parent: Node): string => parent.nodes[0]?.name ?? 'data'

export function* compareStructure(
	node: Node,
	json: Json,
	key: string,
	id = 'id'
): Generator<Difference> {
	const nodeDifference = match<[Node, Json], Generator<Difference>>(
		caseOf([{ type: NodeType.list }, isPrimitiveArray], function* (parent, j) {
			yield* compareStructure(parent, { [primitiveName(parent)]: j[0] }, '', id)
		}),
		caseOf([{ type: NodeType.list }, isObjectArray], function* (_, json) {
			yield* compareStructure(node, mergeAll(json) as JsonArray, '', id)
		}),
		caseOf([isObjOrArray, isObject], function* (_, json) {
			for (const [key, value] of Object.entries(json)) {
				if (id && eqBy(toLower, key, id)) continue // do not import external id field
				yield* compareStructure(
					node.nodes.find(n => eqBy(toLower, key, n.name)) ?? node,
					value,
					key,
					id
				)
			}
		}),
		caseOf([isNil, isColorString], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.color
			}
		}),
		caseOf([isNil, isColorString], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.color
			}
		}),
		caseOf([isNil, isDate], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.date
			}
		}),
		caseOf([isNil, isString], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.string
			}
		}),
		caseOf([isNil, isNumber], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.number
			}
		}),
		caseOf([isNil, isBoolean], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.boolean
			}
		})
	)

	yield* nodeDifference(node, json)
}
