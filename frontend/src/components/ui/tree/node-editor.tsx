import KeyListener from '@/components/utils/key-listener'
import { focusOn, inputValue, stopPropagation } from '@/lib/dom-events'
import { isActiveRef } from '@/lib/react'
import { type TreeNode, confirmNodeName, stopEditing } from '@/state/tree'
import { pipeTap } from 'matchblade'

import { Pencil } from 'lucide-react'
import { pipe } from 'ramda'
import { type RefObject, forwardRef, useLayoutEffect } from 'react'
import { Input } from '../input'

type OwnProps = {
	node: TreeNode
	textBtn: RefObject<HTMLButtonElement | null>
}

export const NodeEditor = forwardRef<HTMLInputElement, OwnProps>(
	({ node, textBtn }, ref) => {
		useLayoutEffect(() => {
			if (isActiveRef(ref)) {
				ref.current.focus()
				ref.current.select()
			}
		}, [ref])

		return (
			<KeyListener
				onEnter={pipeTap(
					stopPropagation,
					pipe(inputValue, confirmNodeName),
					stopEditing,
					focusOn(textBtn)
				)}
				onEscape={pipeTap(stopPropagation, stopEditing, focusOn(textBtn))}
				onArrowLeft={stopPropagation}
				onArrowRight={stopPropagation}
			>
				<Input
					defaultValue={node.name}
					icon={Pencil}
					ref={ref}
					className="py-1 h-7 bg-input"
					onBlur={pipeTap(stopPropagation, stopEditing)}
				/>
			</KeyListener>
		)
	}
)
