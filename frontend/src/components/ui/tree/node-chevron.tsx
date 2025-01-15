import { cn } from '@/lib/utils'
import { type TreeNode, isOpen, updateNodeState } from '@/state/tree'

import { ChevronRight } from 'lucide-react'
import { isNotEmpty } from 'ramda'
import { MicroIcon } from '../random/micro-icon'

type OwnProps = {
	node: TreeNode
}

const DummyIcon = () => <div className="w-4 h-4 shrink-0" />

export const NodeChevron = ({ node }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	const open = isOpen(node.id)

	return hasChildren ? (
		<MicroIcon
			icon={ChevronRight}
			className={cn('transition-all duration-100', {
				'rotate-90': open
			})}
			onClick={() => updateNodeState({ open: !open })(node.id)}
		/>
	) : (
		<DummyIcon />
	)
}
