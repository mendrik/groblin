import { Node } from '@/components/ui/tree/node'
import { dataInt, safeDataInt } from '@/lib/dom-events'
import {
	type TreeNode,
	closeNode,
	focusNode,
	nextNode,
	openNode,
	previousNode,
	updateCurrentNode
} from '@/state/tree'
import { pipe, when } from 'ramda'
import { useRef } from 'react'
import KeyListener from '../../utils/key-listener'
import { NodeCreate } from './node-create'
import { NodeDelete } from './node-delete'

type OwnProps = {
	root: TreeNode
	renderRoot?: boolean
}

function isNotNil<T>(value: T | undefined): value is T {
	return value !== undefined
}

export const Tree = ({ root, renderRoot = false }: OwnProps) => {
	const tree = useRef<HTMLDivElement>(null)
	return (
		<>
			<KeyListener
				onArrowLeft={pipe(dataInt('node_id'), closeNode)}
				onArrowRight={pipe(dataInt('node_id'), openNode)}
				onArrowDown={pipe(nextNode, focusNode)}
				onArrowUp={pipe(previousNode, focusNode)}
				container={tree}
			>
				<div
					ref={tree}
					className="w-full h-full p-1 pl-0 tree"
					onFocus={pipe(
						safeDataInt('node_id'),
						when(isNotNil, updateCurrentNode)
					)}
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
