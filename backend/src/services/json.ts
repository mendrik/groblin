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

export enum Signal {
	NODE_MISSING = 0,
	TYPE_DIFFERENCE = 1
}

export type Difference =
	| {
			signal: Signal.NODE_MISSING
			parent: Node
			type: NodeType
	  }
	| {
			signal: Signal.TYPE_DIFFERENCE
			parent: Node
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

export function* compareStructure(
	node: Node,
	json: Json,
	id = 'id'
): Generator<Difference> {
	const nodeDifference = match<[Node, Json], Generator<Difference>>(
		caseOf([{ type: NodeType.list }, isPrimitiveArray], function* (parent, j) {
			yield* compareStructure(parent, { data: j[0] }, id)
		}),
		caseOf([{ type: NodeType.list }, isObjectArray], function* (_, json) {
			yield* compareStructure(node, mergeAll(json) as JsonArray, id)
		}),
		caseOf([isObjOrArray, isObject], function* (_, json) {
			for (const [key, value] of Object.entries(json)) {
				if (id && eqBy(toLower, key, id)) continue // do not import external id field
				yield* compareStructure(
					node.nodes.find(n => eqBy(toLower, key, n.name)) ?? node,
					value,
					id
				)
			}
		}),
		caseOf([isNil, isColorString], function* () {
			yield {
				parent: node,
				type: NodeType.color,
				signal: Signal.NODE_MISSING
			}
		}),
		caseOf([isNil, isString], function* () {
			yield {
				parent: node,
				type: NodeType.string,
				signal: Signal.NODE_MISSING
			}
		}),
		caseOf([isNil, isNumber], function* () {
			yield {
				parent: node,
				type: NodeType.number,
				signal: Signal.NODE_MISSING
			}
		}),
		caseOf([isNil, isBoolean], function* () {
			yield {
				parent: node,
				type: NodeType.boolean,
				signal: Signal.NODE_MISSING
			}
		})
	)

	yield* nodeDifference(node, json)
}
