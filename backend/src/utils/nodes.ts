import { NodeType, type TreeNode } from 'src/types.ts'

export function* allNodes(node: TreeNode): Generator<TreeNode> {
	yield node
	for (const child of node.nodes) {
		yield* allNodes(child)
	}
}

export const isValueNode = (node: TreeNode) =>
	![NodeType.object, NodeType.root, NodeType.list].includes(node.type)
