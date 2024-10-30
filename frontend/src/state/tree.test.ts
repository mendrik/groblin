import { describe, expect, it } from 'vitest'
import { type TreeNode, parentInTree } from './tree'

describe('parentForRoot', () => {
	const mockTree = {
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
	} as any as TreeNode

	it('returns the correct parent ID for a given node', () => {
		expect(parentInTree(mockTree, 4)).toBe(2)
		expect(parentInTree(mockTree, 2)).toBe(1)
		expect(parentInTree(mockTree, 3)).toBe(1)
	})

	it('throws an error when called on the root node', () => {
		expect(() => parentInTree(mockTree, 1)).toThrow(
			'Parent for node id 1 not found'
		)
	})

	it('throws an error when called on a non-existent node', () => {
		expect(() => parentInTree(mockTree, 999)).toThrow(
			'Parent for node id 999 not found'
		)
	})
})
