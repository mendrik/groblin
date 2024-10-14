import { Node } from '@/components/ui/node'
import { data, focusWithin } from '@/lib/dom-events'
import {
	$focusedNode,
	type TreeNode,
	focusedNodeState,
	selectNextNode,
	selectPreviousNode,
	setEditing,
	setFocusedNode
} from '@/state/tree'
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
		<KeyListener
			onArrowLeft={() => focusedNodeState({ open: false })}
			onArrowRight={() => focusedNodeState({ open: true })}
			onArrowDown={() => selectNextNode(tree.current)}
			onArrowUp={() => selectPreviousNode(tree.current)}
			onEnter={() => setEditing($focusedNode.value)}
		>
			<div
				ref={tree}
				className="w-full h-full p-1 pl-0 tree"
				onFocus={pipe(data('node_id', Number), setFocusedNode)}
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
