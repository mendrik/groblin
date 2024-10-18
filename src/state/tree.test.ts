import { describe, expect, it } from 'vitest'
import { type TreeNode, parentForRoot } from './tree'

describe('parentForRoot', () => {
	const mockTree: TreeNode = {
		id: 1,
		name: 'Root',
		nodes: [
			{
				id: 2,
				name: 'Child 1',
				nodes: [
					{
						id: 4,
						name: 'Grandchild 1',
						nodes: []
					}
				]
			},
			{
				id: 3,
				name: 'Child 2',
				nodes: []
			}
		]
	}

	it('returns the correct parent ID for a given node', () => {
		expect(parentForRoot(mockTree, 4)).toBe(2)
		expect(parentForRoot(mockTree, 2)).toBe(1)
		expect(parentForRoot(mockTree, 3)).toBe(1)
	})

	it('throws an error when called on the root node', () => {
		expect(() => parentForRoot(mockTree, 1)).toThrow(
			'Parent for node id 1 not found'
		)
	})

	it('throws an error when called on a non-existent node', () => {
		expect(() => parentForRoot(mockTree, 999)).toThrow(
			'Parent for node id 999 not found'
		)
	})
})
