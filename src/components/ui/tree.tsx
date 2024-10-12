import { Node } from '@/components/ui/node'
import type { TreeNode } from '@/state/tree'

type OwnProps = {
	root: TreeNode
	renderRoot: boolean
}

export const Tree = ({ root, renderRoot }: OwnProps) => {
	return (
		<div className="w-full h-full pr-1">
			{renderRoot ? (
				<Node node={root} />
			) : (
				root.nodes.map(child => <Node node={child} key={child.id} />)
			)}
		</div>
	)
}
