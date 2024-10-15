import KeyListener from '@/components/utils/key-listener'
import { stopPropagation } from '@/lib/dom-events'
import { pipeTap } from '@/lib/ramda'
import { type TreeNode, notEditing, startEditing } from '@/state/tree'
import { IconFile, IconFolder } from '@tabler/icons-react'
import { isNotEmpty, when } from 'ramda'
import { forwardRef } from 'react'
import { Button } from '../button'

type OwnProps = {
	node: TreeNode
}

export const NodeText = forwardRef<HTMLButtonElement, OwnProps>(
	({ node }, ref) => {
		const hasChildren = isNotEmpty(node.nodes)
		return (
			<KeyListener
				onEnter={pipeTap(stopPropagation, when(notEditing, startEditing))}
			>
				<Button
					type="button"
					variant="ghost"
					className="node flex flex-row px-1 py-0 w-full items-center justify-start h-7"
					data-node_id={node.id}
					ref={ref}
				>
					{hasChildren ? (
						<IconFolder
							focusable={false}
							tabIndex={-1}
							className="w-4 h-4 shrink-0 text-muted-foreground"
							stroke={0.5}
						/>
					) : (
						<IconFile
							focusable={false}
							tabIndex={-1}
							className="w-4 h-4 shrink-0 text-muted-foreground"
							stroke={0.5}
						/>
					)}
					<div className="p-1 font-thin truncate">{node.name}</div>
				</Button>
			</KeyListener>
		)
	}
)
