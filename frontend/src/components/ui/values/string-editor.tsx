import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import {} from '@/state/value'
import {} from '@tabler/icons-react'
import { editorKey, save } from './value-editor'

type StringValue = Value & { value: { content: string } }

type OwnProps = {
	node: TreeNode
	value?: StringValue
}

export const StringEditor = ({ node, value }: OwnProps) => {
	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<input
				key={editorKey(node)}
				className="h-7 bg-transparent border-none appearance-none outline-none ring-0 ml-1"
				defaultValue={value?.value.content}
				onBlur={save(node, value)}
			/>
		</KeyListener>
	)
}
