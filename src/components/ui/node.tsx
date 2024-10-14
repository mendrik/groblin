import { inputValue, stopPropagation } from '@/lib/dom-events'
import { pipeTap } from '@/lib/ramda'
import { isActiveRef } from '@/lib/react'
import { cn } from '@/lib/utils'
import {
	$isEditingNode,
	$nodes,
	type TreeNode,
	notEditing,
	returnFocus,
	startEditing,
	stopEditing,
	updateNodeState
} from '@/state/tree'
import {
	IconChevronRight,
	IconFile,
	IconFolder,
	IconPencil
} from '@tabler/icons-react'
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
			onEnter={pipeTap(stopPropagation, when(notEditing, startEditing))}
		>
			<Button
				type="button"
				variant="ghost"
				className="node flex flex-row px-1 py-0 w-full items-center justify-start h-auto"
				data-node_id={node.id}
				ref={ref}
			>
				{hasChildren ? (
					<IconFolder
						className="w-4 h-4 shrink-0 text-muted-foreground"
						stroke={0.5}
					/>
				) : (
					<IconFile
						className="w-4 h-4 shrink-0 text-muted-foreground"
						stroke={0.5}
					/>
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
	console.log(value)
}

const NodeEditor = forwardRef<HTMLInputElement, NodeEditorProps>(
	({ node }, ref) => {
		useLayoutEffect(() => {
			if (isActiveRef(ref)) {
				ref.current.select()
			}
		}, [ref])
		return (
			<KeyListener
				onEnter={pipeTap(
					stopPropagation,
					stopEditing,
					returnFocus(ref),
					pipe(inputValue, confirmNodeName)
				)}
				onEscape={pipeTap(stopPropagation, returnFocus(ref), stopEditing)}
			>
				<Input
					defaultValue={node.name}
					icon={IconPencil}
					ref={ref}
					className="py-1 h-7"
					onBlur={pipeTap(stopPropagation, stopEditing)}
				/>
			</KeyListener>
		)
	}
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
