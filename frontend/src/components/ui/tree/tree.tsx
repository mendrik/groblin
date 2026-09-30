import { isNotNil, pipe, when } from 'ramda'
import { useRef } from 'react'
import { Node } from '@/components/ui/tree/node'
import { EmptyList } from '@/components/utils/empty-list'
import { dataInt, safeDataInt } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import { $canManage } from '@/state/access'
import {
	closeNode,
	focusNode,
	nextNode,
	openNode,
	previousNode,
	type TreeNode,
	updateNodeContext
} from '@/state/tree'
import KeyListener from '../../utils/key-listener'
import { Button } from '../button'
import { ImportArrayDialog } from '../io/import-array-dialog'
import { NodeCreate, openNodeCreate } from './node-create'
import { NodeProperties } from './node-properties'

type OwnProps = {
	root: TreeNode
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
					role="tree"
					aria-label="Project nodes"
					className={cn('w-full px-2 tree', root.nodes.length && 'grid-lines')}
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
								disabled={!$canManage.value}
								onClick={() => openNodeCreate(root, 'root-child')}
								variant="outline"
							>
								Add node…
							</Button>
						</div>
					</EmptyList>
				</div>
			</KeyListener>
			<NodeCreate />
			<NodeProperties />
			<ImportArrayDialog />
		</>
	)
}
