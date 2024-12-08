import { describe, expect, test } from 'vitest'

import type { TreeOf } from '@shared/utils/list-to-tree.ts'
import type { Json } from 'src/database/schema.ts'
import { NodeType } from 'src/enums.ts'
import type { Node as DBNode } from 'src/resolvers/node-resolver.ts'
import { compareStructure } from './json.ts'

type Node = TreeOf<DBNode, 'nodes'>

describe('compareStructure', () => {
	test('should detect missing node', () => {
		const node = {
			name: 'root',
			type: NodeType.object,
			nodes: []
		} as unknown as Node
		const json: Json = { key: 'value' }
		const result = [...compareStructure(node, json)]
		expect(result).toEqual([{ parent: node, key: 'key', case: 'NODE_MISSING' }])
	})

	test('should detect type difference', () => {
		const node = {
			name: 'root',
			type: NodeType.object,
			nodes: [{ name: 'key', type: NodeType.string, nodes: [] }]
		} as unknown as Node
		const json: Json = { key: 123 }
		const result = [...compareStructure(node, json)]
		expect(result).toEqual([
			{ parent: node.nodes[0], key: 'key', case: 'TYPE_DIFFERENCE' }
		])
	})

	test('should handle matching structures', () => {
		const node = {
			name: 'root',
			type: NodeType.object,
			nodes: [{ name: 'key', type: NodeType.string, nodes: [] }]
		} as unknown as Node
		const json: Json = { key: 'value' }
		const result = [...compareStructure(node, json)]
		expect(result).toEqual([])
	})

	test('should handle nested structures', () => {
		const node = {
			name: 'root',
			type: NodeType.object,
			nodes: [
				{
					name: 'nested',
					type: NodeType.object,
					nodes: [{ name: 'key', type: NodeType.string, nodes: [] }]
				}
			]
		} as unknown as Node
		const json: Json = { nested: { key: 'value' } }
		const result = [...compareStructure(node, json)]
		expect(result).toEqual([])
	})

	test('should handle arrays', () => {
		const node = {
			name: 'root',
			type: NodeType.list,
			nodes: []
		} as unknown as Node
		const json: Json = [{ key1: 'value' }, { key2: 'value' }]
		const result = [...compareStructure(node, json)]
		expect(result).toEqual([
			{
				case: 'NODE_MISSING',
				key: 'key1',
				parent: {
					name: 'root',
					nodes: [],
					type: 'List'
				}
			},
			{
				case: 'NODE_MISSING',
				key: 'key2',
				parent: {
					name: 'root',
					nodes: [],
					type: 'List'
				}
			}
		])
	})

	test('should detect missing node in array', () => {
		const node = {
			name: 'root',
			type: NodeType.list,
			nodes: []
		} as unknown as Node
		const json: Json = ['value']
		expect(() => [...compareStructure(node, json)]).toThrowError(
			expect.objectContaining({ message: 'List contains primitive values' })
		)
	})
})
