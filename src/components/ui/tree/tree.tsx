import { Node } from '@/components/ui/tree/node'
import { data } from '@/lib/dom-events'
import {
	type TreeNode,
	focusNode,
	nextNode,
	openNode,
	previousNode,
	setFocusedNode,
	updateNodeState
} from '@/state/tree'
import { pipe } from 'ramda'
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
				onArrowLeft={pipe(
					data('node_id', Number.parseInt),
					updateNodeState({ open: false })
				)}
				onArrowRight={pipe(data('node_id', Number.parseInt), openNode)}
				onArrowDown={pipe(nextNode, focusNode)}
				onArrowUp={pipe(previousNode, focusNode)}
			>
				<div
					ref={tree}
					className="w-full h-full p-1 pl-0 tree"
					onFocus={pipe(data('node_id', Number), setFocusedNode)}
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
