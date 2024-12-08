import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { T as _, any, mergeAll } from 'ramda'
import {
	isArray,
	isBoolean,
	isNumber,
	isObject,
	isPrimitive,
	isString
} from 'ramda-adjunct'
import type { Json } from 'src/database/schema.ts'
import { NodeType } from 'src/enums.ts'
import type { Node as DbNode } from 'src/resolvers/node-resolver.ts'

enum Case {
	NODE_MISSING = 'NODE_MISSING',
	TYPE_DIFFERENCE = 'TYPE_DIFFERENCE'
}

type Difference = {
	parent: Node | undefined
	key: string | number
	case: Case
}

type Node = TreeOf<DbNode, 'nodes'>

function* noop() {}

const isObjOrArray = (n: Node) =>
	n.type === NodeType.object || n.type === NodeType.list

export function* compareStructure(
	node: Node,
	json: Json
): Generator<Difference> {
	const res = match<[Node, Json], Generator<Difference>>(
		caseOf([{ type: NodeType.list }, isArray], function* (parent, j) {
			if (any(isPrimitive, j)) {
				throw new Error('List contains primitive values')
			}
			const structure = mergeAll(j)
			yield* compareStructure(parent, structure)
		}),
		caseOf([isObjOrArray, isObject], function* (parent, j) {
			for (const [key, value] of Object.entries(j)) {
				const child = parent.nodes.find(n => n.name === key)
				if (!child) {
					yield { parent, key, case: Case.NODE_MISSING }
				} else {
					yield* compareStructure(child, value)
				}
			}
		}),
		//todo isColorString, isDate
		caseOf([{ type: NodeType.string }, isString], noop),
		caseOf([{ type: NodeType.number }, isNumber], noop),
		caseOf([{ type: NodeType.boolean }, isBoolean], noop),
		caseOf([_, _], function* (parent, j) {
			yield { parent, key: parent.name, case: Case.TYPE_DIFFERENCE }
		})
	)
	yield* res(node, json)
}
