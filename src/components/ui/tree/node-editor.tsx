import KeyListener from '@/components/utils/key-listener'
import { focusOn, inputValue, stopPropagation } from '@/lib/dom-events'
import { asyncPipeTap, pipeTap } from '@/lib/ramda'
import { isActiveRef } from '@/lib/react'
import {
	type TreeNode,
	confirmNodeName,
	stopEditing,
	waitForUpdate
} from '@/state/tree'
import { IconPencil } from '@tabler/icons-react'
import { pipe } from 'ramda'
import { forwardRef, useLayoutEffect } from 'react'
import { Input } from '../input'

type OwnProps = {
	node: TreeNode
	textBtn: React.Ref<HTMLButtonElement>
}

export const NodeEditor = forwardRef<HTMLInputElement, OwnProps>(
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
					focusOn(textBtn)
				)}
				onEscape={asyncPipeTap(stopPropagation, stopEditing, focusOn(textBtn))}
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
