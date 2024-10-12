import { useUpdateLocalStorage } from '@/lib/hooks/useUpdateLocalStorage'
import { cn } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import {
	IconChevronDown,
	IconChevronRight,
	IconFile,
	IconFolder
} from '@tabler/icons-react'
import { isNotEmpty } from 'ramda'
import { type TypeOf, boolean, object } from 'zod'
import { Button } from './button'

type OwnProps = {
	node: TreeNode
	depth: number
}

const NodeState = object({
	open: boolean().default(false)
})

type TNodeState = TypeOf<typeof NodeState>

export const Node = ({ node, depth }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	const [nodeState, updateNodeState] = useUpdateLocalStorage<TNodeState>(
		`node-state-${node.id}`,
		NodeState,
		{ open: false }
	)
	return (
		<ol className={cn(`list-none m-0`)} style={{ paddingLeft: depth * 16 }}>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full">
					<Button
						type="button"
						variant="ghost"
						className="flex-0 shrink-0 p-0 w-4 h-auto"
					>
						{hasChildren ? (
							nodeState.open ? (
								<IconChevronDown
									className="w-4 h-4"
									onClick={() => updateNodeState({ open: true })}
								/>
							) : (
								<IconChevronRight
									className="w-4 h-4"
									onClick={() => updateNodeState({ open: false })}
								/>
							)
						) : null}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="flex flex-row gap-1 px-1 py-0 w-full items-center justify-start h-auto"
					>
						{hasChildren ? (
							<IconFolder className="w-4 h-4 shrink-0" />
						) : (
							<IconFile className="w-4 h-4 shrink-0" />
						)}
						<div className="p-1">{node.name}</div>
					</Button>
				</div>
				{node.nodes.map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
