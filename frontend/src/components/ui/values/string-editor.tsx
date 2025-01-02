import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { inputValue, stopPropagation } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import { pipeAsync } from '@shared/utils/pipe-async'
import { objOf } from 'ramda'
import { editorKey, save } from './value-editor'

type StringValue = Value & { value: { content: string } }

type OwnProps = {
	node: TreeNode
	value?: StringValue
}

export const saveInput = (node: TreeNode, value?: StringValue) =>
	pipeAsync(inputValue, objOf('content'), save(node, value))

export const StringEditor = ({ node, value }: OwnProps) => {
	console.log('StringEditor', value?.value?.content)

	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<input
				key={editorKey(node, value)}
				className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0"
				defaultValue={value?.value?.content ?? undefined}
				onBlur={saveInput(node, value)}
			/>
		</KeyListener>
	)
}
