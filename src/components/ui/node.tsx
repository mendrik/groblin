import { inputValue, stopPropagation } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import {
	$isEditingNode,
	$nodes,
	type TreeNode,
	returnFocus,
	setEditing,
	updateNodeState
} from '@/state/tree'
import { IconChevronRight, IconFile, IconFolder } from '@tabler/icons-react'
import { always, isNotEmpty, pipe } from 'ramda'
import { useLayoutEffect, useRef } from 'react'
import {} from 'zod'
import KeyListener from '../utils/key-listener'
import { Button } from './button'
import { Input } from './input'

type NodeTextProps = {
	node: TreeNode
	hasChildren: boolean
}

const NodeText = ({ node, hasChildren }: NodeTextProps) => (
	<Button
		type="button"
		variant="ghost"
		className="node flex flex-row gap-1 px-1 py-0 w-full items-center justify-start h-auto"
		data-node_id={node.id}
	>
		{hasChildren ? (
			<IconFolder className="w-4 h-4 shrink-0 text-muted-foreground" />
		) : (
			<IconFile className="w-4 h-4 shrink-0 text-muted-foreground" />
		)}
		<div className="p-1 font-thin">{node.name}</div>
	</Button>
)

type NodeEditorProps = {
	node: TreeNode
}

const confirmNodeName = (value: string): void => {
	setEditing(undefined)
	console.log(value)
}

const abortEdit = (): void => {
	setEditing(undefined)
}

const NodeEdtor = ({ node }: NodeEditorProps) => {
	const editor = useRef<HTMLInputElement>(null)
	useLayoutEffect(() => {
		if (editor.current) {
			editor.current.focus()
		}
	})
	return (
		<KeyListener
			onEnter={pipe(
				stopPropagation,
				returnFocus(node.id),
				inputValue,
				confirmNodeName
			)}
			onEscape={pipe(stopPropagation, returnFocus(node.id), abortEdit)}
		>
			<Input
				defaultValue={node.name}
				onBlur={() => setEditing(undefined)}
				ref={editor}
			/>
		</KeyListener>
	)
}

type OwnProps = {
	node: TreeNode
	depth: number
}

const DummyIcon = () => <div className="w-4 h-4 shrink-0" />

export const Node = ({ node, depth }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	const isOpen = $nodes.value[node.id]?.open
	return (
		<ol className={cn(`list-none m-0`)} style={{ paddingLeft: depth * 16 }}>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full">
					{hasChildren ? (
						<Button
							type="button"
							variant="ghost"
							className="flex-0 shrink-0 p-0 w-4 h-auto"
							tabIndex={-1}
						>
							<IconChevronRight
								className={cn('w-4 h-4 transition-all duration-100', {
									'rotate-90': isOpen
								})}
								onClick={() => updateNodeState(node.id, { open: !isOpen })}
							/>
						</Button>
					) : (
						<DummyIcon />
					)}
					{node.id === $isEditingNode.value ? (
						<NodeEdtor node={node} />
					) : (
						<NodeText hasChildren={hasChildren} node={node} />
					)}
				</div>
				{node.nodes.filter(always(isOpen)).map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
