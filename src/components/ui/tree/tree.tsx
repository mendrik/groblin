import { Node } from '@/components/ui/tree/node'
import { data, focusWithin } from '@/lib/dom-events'
import { type TreeNode, removeFocusedNode, setFocusedNode } from '@/state/tree'
import { isNil, pipe, unless } from 'ramda'
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
				onArrowLeft={() => void 0}
				onArrowRight={() => void 0}
				onArrowDown={() => void 0}
				onArrowUp={() => void 0}
			>
				<div
					ref={tree}
					className="w-full h-full p-1 pl-0 tree"
					onFocus={pipe(data('node_id', Number), unless(isNil, setFocusedNode))}
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
