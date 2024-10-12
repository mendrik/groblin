import type { TreeNode } from '@/state/tree'

type OwnProps = {
	node: TreeNode
}

export const Node = ({ node }: OwnProps) => {
	return (
		<ol>
			<li data-node_id={node.id}>{node.name}</li>
			{node.nodes.map(child => (
				<Node node={child} key={child.id} />
			))}
		</ol>
	)
}
