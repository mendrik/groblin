import KeyListener from '@/components/utils/key-listener'
import { focusOn, inputValue, stopPropagation } from '@/lib/dom-events'
import { isActiveRef } from '@/lib/react'
import { type TreeNode, confirmNodeName, stopEditing } from '@/state/tree'
import { pipeTap } from '@shared/utils/pipe-tap'
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
					icon={IconPencil}
					ref={ref}
					className="py-1 h-7 bg-input"
					onBlur={pipeTap(stopPropagation, stopEditing)}
				/>
			</KeyListener>
		)
	}
)
