import { Node } from '@/components/ui/tree/node'
import { data, focusWithin } from '@/lib/dom-events'
import {
	type TreeNode,
	focusedNodeState,
	removeFocusedNode,
	selectNextNode,
	selectPreviousNode,
	setFocusedNode
} from '@/state/tree'
import { pipe, unless } from 'ramda'
import { useRef } from 'react'
import KeyListener from '../../utils/key-listener'
import { NodeCreate } from './node-create'
import { NodeDelete } from './node-delete'

type OwnProps = {
	root: TreeNode
	renderRoot?: boolean
}

export const Tree = ({ root, renderRoot = false }: OwnProps) => {
	const tree = useRef<HTMLDivElement>(null)
	return (
		<>
			<KeyListener
				onArrowLeft={() => focusedNodeState({ open: false })}
				onArrowRight={() => focusedNodeState({ open: true })}
				onArrowDown={() => selectNextNode(tree.current)}
				onArrowUp={() => selectPreviousNode(tree.current)}
			>
				<div
					ref={tree}
					className="w-full h-full p-1 pl-0"
					onFocus={pipe(data('node_id', Number), setFocusedNode)}
					onBlur={unless(() => focusWithin(tree.current), removeFocusedNode)}
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
			<NodeDelete />
			<NodeCreate />
		</>
	)
}
