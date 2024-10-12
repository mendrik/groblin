import { Node } from '@/components/ui/node'
import { data, focusWithin } from '@/lib/dom-events'
import { type TreeNode, setFocusedNode } from '@/state/tree'
import { pipe, unless } from 'ramda'

type OwnProps = {
	root: TreeNode
	renderRoot?: boolean
}

export const Tree = ({ root, renderRoot = false }: OwnProps) => {
	return (
		<div
			className="w-full h-full p-1 pl-0"
			onFocus={pipe(data('node_id'), setFocusedNode)}
			onBlur={unless(focusWithin, () => setFocusedNode(undefined))}
		>
			{renderRoot ? (
				<Node node={root} depth={0} />
			) : (
				root.nodes.map(child => <Node node={child} key={child.id} depth={0} />)
			)}
		</div>
	)
}
