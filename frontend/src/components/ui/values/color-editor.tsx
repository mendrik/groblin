import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { inputValue, stopPropagation } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import { pipeAsync } from '@shared/utils/pipe-async'
import { editorKey, save } from './value-editor'

type ColorValue = Value & {
	color: {
		r: number
		g: number
		b: number
		a: number
	}
}

type OwnProps = {
	node: TreeNode
	value?: ColorValue
}

export const saveInput = (node: TreeNode, value?: ColorValue) =>
	pipeAsync(inputValue, save(node, value))

export const StringEditor = ({ node, value }: OwnProps) => {
	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<input
				key={editorKey(node)}
				className="h-7 bg-transparent border-none appearance-none outline-none ring-0 ml-1"
				defaultValue={value?.value.content}
				onBlur={saveInput(node, value)}
			/>
		</KeyListener>
	)
}
