import KeyListener from '@/components/utils/key-listener'
import { stopPropagation } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import { type TreeNode, notEditing, startEditing } from '@/state/tree'
import { pipeTap } from 'matchblade'
import { isNotEmpty, pipe, when } from 'ramda'
import { forwardRef } from 'react'
import { Button } from '../button'
import { Icon } from '../simple/icon'
import { openNodeDelete } from './node-delete'
import { nodeIcon } from './node-icon'

type OwnProps = {
	node: TreeNode
}

export const NodeText = forwardRef<HTMLButtonElement, OwnProps>(
	({ node }, ref) => {
		const hasChildren = isNotEmpty(node.nodes)
		return (
			<KeyListener
				onEnter={pipeTap(
					stopPropagation,
					when(notEditing, () => startEditing(node.id))
				)}
				onDelete={pipe(stopPropagation, () => openNodeDelete(node))}
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
