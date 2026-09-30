import { pipeTap } from 'matchblade'
import { isNotEmpty, pipe, when } from 'ramda'
import { forwardRef } from 'react'
import KeyListener from '@/components/utils/key-listener'
import { stopPropagation } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import { $canManage } from '@/state/access'
import {
	deleteNode,
	notEditing,
	startEditing,
	type TreeNode
} from '@/state/tree'
import { Button } from '../button'
import { Icon } from '../simple/icon'
import { nodeIcon } from './node-icon'

type OwnProps = {
	node: TreeNode
}

export const NodeText = forwardRef<HTMLButtonElement, OwnProps>(
	({ node }, ref) => {
		const _hasChildren = isNotEmpty(node.nodes)
		return (
			<KeyListener
				onEnter={
					$canManage.value
						? pipeTap(
								stopPropagation,
								when(notEditing, () => startEditing(node.id))
							)
						: undefined
				}
				onDelete={
					$canManage.value
						? pipe(stopPropagation, () => deleteNode(node.id))
						: undefined
				}
			>
				<Button
					type="button"
					variant="ghost"
					className="node flex flex-row px-1 py-0 w-full items-center justify-start h-7 hover:bg-inherit focus-visible:z-10"
					data-node_id={node.id}
					id={`node-${node.id}`}
					ref={ref}
				>
					<Icon icon={nodeIcon(node)} />
					<div className={cn('p-1 truncate font-light')}>{node.name}</div>
				</Button>
			</KeyListener>
		)
	}
)
