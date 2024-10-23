import { Node } from '@/components/ui/tree/node'
import { EmptyList } from '@/components/utils/empty-list'
import { dataInt, safeDataInt } from '@/lib/dom-events'
import {
	type TreeNode,
	closeNode,
	focusNode,
	nextNode,
	openNode,
	previousNode,
	updateNodeContext
} from '@/state/tree'
import { pipe, when } from 'ramda'
import { useRef } from 'react'
import KeyListener from '../../utils/key-listener'
import { Button } from '../button'
import { NodeCreate, openNodeCreate } from './node-create'
import { NodeDelete } from './node-delete'

type OwnProps = {
	root: TreeNode
}

function isNotNil<T>(value: T | undefined): value is T {
	return value !== undefined
}

export const Tree = ({ root }: OwnProps) => {
	const tree = useRef<HTMLDivElement>(null)
	return (
		<>
			<KeyListener
				onArrowLeft={pipe(dataInt('node_id'), closeNode)}
				onArrowRight={pipe(dataInt('node_id'), openNode)}
				onArrowDown={pipe(nextNode, focusNode)}
				onArrowUp={pipe(previousNode, focusNode)}
			>
				<div
					ref={tree}
					className="w-full px-2 tree grid-lines"
					onFocus={pipe(
						safeDataInt('node_id'),
						when(isNotNil, updateNodeContext)
					)}
				>
					{root.nodes.map(child => (
						<Node node={child} key={child.id} depth={0} />
					))}
					<EmptyList list={root.nodes}>
						<div className="flex justify-center p-4">
							<Button
								onClick={() => openNodeCreate('root-child')}
								variant="outline"
							>
								Add node...
							</Button>
						</div>
					</EmptyList>
				</div>
			</KeyListener>
			<NodeDelete />
			<NodeCreate />
		</>
	)
}
