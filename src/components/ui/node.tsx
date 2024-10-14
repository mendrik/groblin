import { inputValue, stopPropagation } from '@/lib/dom-events'
import { isActiveRef } from '@/lib/react'
import { cn } from '@/lib/utils'
import {
	$focusedNode,
	$isEditingNode,
	$nodes,
	type TreeNode,
	notEditing,
	returnFocus,
	setEditing,
	stopEditing,
	updateNodeState
} from '@/state/tree'
import { IconChevronRight, IconFile, IconFolder } from '@tabler/icons-react'
import { always, isNotEmpty, pipe, when } from 'ramda'
import { forwardRef, useLayoutEffect, useRef } from 'react'
import { usePrevious } from 'react-use'
import {} from 'zod'
import KeyListener from '../utils/key-listener'
import { Button } from './button'
import { Input } from './input'

type NodeTextProps = {
	node: TreeNode
	hasChildren: boolean
}

const NodeText = forwardRef<HTMLButtonElement, NodeTextProps>(
	({ node, hasChildren }, ref) => (
		<KeyListener
			onEnter={pipe(
				stopPropagation,
				when(notEditing, () => setEditing($focusedNode.value))
			)}
		>
			<Button
				type="button"
				variant="ghost"
				className="node flex flex-row gap-1 px-1 py-0 w-full items-center justify-start h-auto"
				data-node_id={node.id}
				ref={ref}
			>
				{hasChildren ? (
					<IconFolder className="w-4 h-4 shrink-0 text-muted-foreground" />
				) : (
					<IconFile className="w-4 h-4 shrink-0 text-muted-foreground" />
				)}
				<div className="p-1 font-thin">{node.name}</div>
			</Button>
		</KeyListener>
	)
)

type NodeEditorProps = {
	node: TreeNode
}

const confirmNodeName = (value: string): void => {
	setEditing(undefined)
	console.log(value)
}

const NodeEditor = forwardRef<HTMLInputElement, NodeEditorProps>(
	({ node }, ref) => (
		<KeyListener
			onEnter={pipe(
				stopPropagation,
				stopEditing,
				returnFocus(ref),
				inputValue,
				confirmNodeName
			)}
			onEscape={pipe(stopPropagation, returnFocus(ref), stopEditing)}
		>
			<Input
				defaultValue={node.name}
				onBlur={() => setEditing(undefined)}
				ref={ref}
			/>
		</KeyListener>
	)
)

type OwnProps = {
	node: TreeNode
	depth: number
}

const DummyIcon = () => <div className="w-4 h-4 shrink-0" />

export const Node = ({ node, depth }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	const isOpen = $nodes.value[node.id]?.open
	const editor = useRef<HTMLInputElement>(null)
	const textBtn = useRef<HTMLButtonElement>(null)
	const previouslyEdited = usePrevious($isEditingNode.value)

	useLayoutEffect(() => {
		if (isActiveRef(textBtn) && previouslyEdited === node.id) {
			textBtn.current.focus()
		}
	}, [previouslyEdited, node.id])

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
						<NodeEditor node={node} ref={editor} />
					) : (
						<NodeText hasChildren={hasChildren} node={node} ref={textBtn} />
					)}
				</div>
				{node.nodes.filter(always(isOpen)).map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
