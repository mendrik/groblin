import { cn } from '@/lib/utils'
import { type TreeNode, isOpen, updateNodeState } from '@/state/tree'
import { IconChevronRight } from '@tabler/icons-react'
import { isNotEmpty } from 'ramda'
import { Button } from '../button'

type OwnProps = {
	node: TreeNode
}

const DummyIcon = () => <div className="w-4 h-4 shrink-0" />

export const NodeChevron = ({ node }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	const open = isOpen(node.id)

	return hasChildren ? (
		<Button
			type="button"
			variant="ghost"
			className="flex-0 shrink-0 p-0 w-4 h-auto"
			tabIndex={-1}
		>
			<IconChevronRight
				className={cn('w-4 h-4 transition-all duration-100', {
					'rotate-90': open
				})}
				focusable={false}
				tabIndex={-1}
				onClick={() => updateNodeState({ open: !open })(node.id)}
			/>
		</Button>
	) : (
		<DummyIcon />
	)
}
