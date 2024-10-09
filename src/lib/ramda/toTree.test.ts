import { describe, it } from 'node:test'
import { deepEqual } from 'node:assert'
import { listToTree } from './toTree.ts'

describe('listToTree', () => {
	it('should work', () => {
		const nodes = [
			{ id: '1', name: 'Root', parent_id: null },
			{ id: '2', name: 'Child 1', parent_id: '1' },
			{ id: '3', name: 'Child 2', parent_id: '1' },
			{ id: '4', name: 'Grandchild', parent_id: '2' },
			{ id: '5', name: 'Grandchild 2', parent_id: '3' }
		]
		const toTree = listToTree('id', 'parent_id', 'nodes')
		deepEqual(toTree(nodes), {
			...nodes[0],
			nodes: [
				{ ...nodes[1], nodes: [{ ...nodes[3], nodes: [] }] },
				{ ...nodes[2], nodes: [{ ...nodes[4], nodes: [] }] }
			]
		})
	})
})
