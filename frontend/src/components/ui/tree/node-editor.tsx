import { Pencil } from 'lucide-react'
import { forwardRef, type RefObject, useLayoutEffect, useState } from 'react'
import KeyListener from '@/components/utils/key-listener'
import { focusOn, inputValue, stopPropagation } from '@/lib/dom-events'
import { isActiveRef } from '@/lib/react'
import {
	confirmNodeName,
	nodeSaves,
	stageNodeName,
	stopEditing,
	type TreeNode
} from '@/state/tree'
import { Input } from '../input'

type OwnProps = {
	node: TreeNode
	textBtn: RefObject<HTMLButtonElement | null>
}

export const NodeEditor = forwardRef<HTMLInputElement, OwnProps>(
	({ node, textBtn }, ref) => {
		const [busy, setBusy] = useState(false)
		const [error, setError] = useState<string>()
		const draft = nodeSaves.edits.value.find(edit => edit.data.id === node.id)
		const submit = async (value: string) => {
			if (busy) return
			setBusy(true)
			setError(undefined)
			try {
				await confirmNodeName(value)
				stopEditing()
				focusOn(textBtn)()
			} catch (error) {
				setError(
					error instanceof Error
						? error.message
						: 'Rename failed. Your edit has been kept.'
				)
			} finally {
				setBusy(false)
			}
		}

		useLayoutEffect(() => {
			if (isActiveRef(ref)) {
				ref.current.focus()
				ref.current.select()
			}
		}, [ref])

		return (
			<KeyListener
				onEnter={event => {
					stopPropagation(event)
					void submit(inputValue(event))
				}}
				onEscape={event => {
					stopPropagation(event)
					if (!busy) {
						if (draft) nodeSaves.discard(draft.key)
						stopEditing()
						focusOn(textBtn)()
					}
				}}
				onArrowLeft={stopPropagation}
				onArrowRight={stopPropagation}
			>
				<Input
					defaultValue={draft?.data.name ?? node.name}
					disabled={busy}
					aria-invalid={Boolean(error)}
					title={error}
					onChange={event => stageNodeName(inputValue(event))}
					icon={Pencil}
					ref={ref}
					className="py-1 h-7 bg-input"
					onBlur={event => {
						stopPropagation(event)
						if (!busy) stopEditing()
					}}
				/>
			</KeyListener>
		)
	}
)
