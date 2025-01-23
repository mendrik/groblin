import type { TreeNode } from 'src/types.ts'

export function* allNodes(node: TreeNode): Generator<TreeNode> {
	yield node
	for (const child of node.nodes) {
		yield* allNodes(child)
	}
}
