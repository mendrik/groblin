import { throwError } from '@shared/errors.ts'
import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { F, T, eqBy, mergeAll, toLower, toUpper } from 'ramda'
import {
	isArray,
	isBoolean,
	isNumber,
	isObject,
	isPlainObj,
	isPrimitive,
	isString
} from 'ramda-adjunct'
import type { Json, JsonArray, JsonObject } from 'src/database/schema.ts'
import { NodeType } from 'src/enums.ts'
import type { Node as DbNode } from 'src/resolvers/node-resolver.ts'
import { color } from 'src/utils/color-codec.ts'
import { date } from 'src/utils/date-codec.ts'

export enum Signal {
	MISSING = 'MISSING',
	NOTHING = 'NOTHING'
}

export type Difference = {
	key: string
	parent: Node
	type: NodeType
	signal: Signal
}

export type Node = TreeOf<DbNode, 'nodes'>

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

const isJsonObject = (json: unknown): json is JsonObject => isPlainObj(json)

const primitiveName = (parent: Node): string => parent.nodes[0]?.name ?? 'data'

const findValue = (name: string, json: JsonObject): Json | undefined =>
	json[name] ?? json[toLower(name)] ?? json[toUpper(name)]

const validateExistingNodes = match<[Node, Json | undefined], boolean>(
	caseOf([{ type: NodeType.number }, isNumber], T),
	caseOf([{ type: NodeType.color }, isColorString], T),
	caseOf([{ type: NodeType.date }, isDate], T),
	caseOf([{ type: NodeType.string }, isString], T),
	caseOf([{ type: NodeType.list }, isArray], T),
	caseOf([{ type: NodeType.object }, isPlainObj], T),
	caseOf([T, T], F)
)

export function* compareStructure(
	node: Node,
	json: Json,
	key: string,
	id = 'id'
): Generator<Difference> {
	const nodeDifference = match<[Node, Json], Generator<Difference>>(
		caseOf([{ type: NodeType.list }, isPrimitiveArray], function* (_, j) {
			yield* compareStructure(node, { [primitiveName(node)]: j[0] }, '', id)
		}),
		caseOf([{ type: NodeType.list }, isObjectArray], function* (_, json) {
			yield* compareStructure(node, mergeAll(json) as JsonArray, '', id)
		}),
		caseOf([isObjOrArray, isJsonObject], function* (_, json) {
			for (const childNode of node.nodes) {
				if (
					!validateExistingNodes(childNode, findValue(childNode.name, json))
				) {
					throwError(`Type mismatch: ${childNode.name} has no match in json`)
				}
			}
			for (const [key, value] of Object.entries(json)) {
				if (id && eqBy(toLower, key, id)) continue // do not import external id field
				const existingNode = node.nodes.find(n => eqBy(toLower, key, n.name))
				if (!existingNode && value) {
					yield* compareStructure(node, value, key, id)
				}
			}
		}),
		caseOf([T, isColorString], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.color,
				signal: Signal.MISSING
			}
		}),
		caseOf([T, isColorString], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.color,
				signal: Signal.MISSING
			}
		}),
		caseOf([T, isDate], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.date,
				signal: Signal.MISSING
			}
		}),
		caseOf([T, isString], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.string,
				signal: Signal.MISSING
			}
		}),
		caseOf([T, isNumber], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.number,
				signal: Signal.MISSING
			}
		}),
		caseOf([T, isBoolean], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.boolean,
				signal: Signal.MISSING
			}
		}),
		caseOf([T, T], function* () {
			yield {
				key,
				parent: node,
				type: NodeType.object,
				signal: Signal.NOTHING
			}
		})
	)

	yield* nodeDifference(node, json)
}
