import { inputValue, stopPropagation } from '@/lib/dom-events'
import { asyncPipeTap, pipeTap } from '@/lib/ramda'
import { isActiveRef } from '@/lib/react'
import { cn } from '@/lib/utils'
import {
	$focusedNode,
	$isEditingNode,
	$nodes,
	type TreeNode,
	confirmNodeName,
	notEditing,
	returnFocus,
	startEditing,
	stopEditing,
	updateNodeState,
	waitForUpdate
} from '@/state/tree'
import {
	IconChevronRight,
	IconDots,
	IconFile,
	IconFolder,
	IconPencil
} from '@tabler/icons-react'
import { always, isNotEmpty, pipe, when } from 'ramda'
import { forwardRef, useLayoutEffect, useRef } from 'react'
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
)

type NodeEditorProps = {
	node: TreeNode
	textBtn: React.Ref<HTMLButtonElement>
}

const NodeEditor = forwardRef<HTMLInputElement, NodeEditorProps>(
	({ node, textBtn }, ref) => {
		useLayoutEffect(() => {
			if (isActiveRef(ref)) {
				ref.current.select()
			}
		}, [ref])

		return (
			<KeyListener
				onEnter={asyncPipeTap(
					stopPropagation,
					pipe(inputValue, confirmNodeName),
					waitForUpdate,
					stopEditing,
					returnFocus(textBtn)
				)}
				onEscape={pipeTap(stopPropagation, stopEditing, returnFocus(textBtn))}
			>
				<Input
					defaultValue={node.name}
					icon={IconPencil}
					ref={ref}
					className="py-1 h-7 bg-teal-950"
					onBlur={pipeTap(stopPropagation, stopEditing)}
				/>
			</KeyListener>
		)
	}
)

type NodeOptionsProps = {
	node: TreeNode
}

const NodeOptions = ({ node }: NodeOptionsProps) => {
	return $focusedNode.value === node.id ? (
		<Button
			type="button"
			variant="ghost"
			className="h-6 w-6 flex items-center justify-center px-1 py-0 ml-auto"
			tabIndex={-1}
		>
			<IconDots
				className="w-4 h-4 shrink-0 text-muted-foreground"
				focusable={false}
				tabIndex={-1}
				stroke={0.5}
			/>
		</Button>
	) : (
		<div className="w-6 h-6 shrink-0 ml-auto" />
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
	const editor = useRef<HTMLInputElement>(null)
	const textBtn = useRef<HTMLButtonElement>(null)

	return (
		<ol className={cn(`list-none m-0`)} style={{ paddingLeft: depth * 16 }}>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full gap-1">
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
								focusable={false}
								tabIndex={-1}
								onClick={() => updateNodeState(node.id, { open: !isOpen })}
							/>
						</Button>
					) : (
						<DummyIcon />
					)}
					{node.id === $isEditingNode.value ? (
						<NodeEditor node={node} ref={editor} textBtn={textBtn} />
					) : (
						<NodeText hasChildren={hasChildren} node={node} ref={textBtn} />
					)}
					<NodeOptions node={node} />
				</div>
				{node.nodes.filter(always(isOpen)).map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
