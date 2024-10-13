import { Node } from '@/components/ui/node'
import { data, focusWithin } from '@/lib/dom-events'
import { type TreeNode, setFocusedNode } from '@/state/tree'
import { pipe, unless } from 'ramda'
import { useRef } from 'react'
import KeyListener from '../utils/key-listener'

type OwnProps = {
	root: TreeNode
	renderRoot?: boolean
}

const resetNode = () => setFocusedNode(undefined)

export const Tree = ({ root, renderRoot = false }: OwnProps) => {
	const tree = useRef<HTMLDivElement>(null)
	return (
		<KeyListener onArrowDown={console.log}>
			<div
				ref={tree}
				className="w-full h-full p-1 pl-0"
				onFocus={pipe(data('node_id'), setFocusedNode)}
				onBlur={unless(focusWithin(tree.current), resetNode)}
			>
				{renderRoot ? (
					<Node node={root} depth={0} />
				) : (
					root.nodes.map(child => (
						<Node node={child} key={child.id} depth={0} />
					))
				)}
			</div>
		</KeyListener>
	)
}
