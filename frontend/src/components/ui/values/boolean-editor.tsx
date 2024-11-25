import type { Value } from '@/gql/graphql'
import {} from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import {} from '@/state/value'
import {} from '@tabler/icons-react'
import { Switch } from '../switch'
import { editorKey, save } from './value-editor'

type BooleanValue = Value & { value: { content: boolean } }

type OwnProps = {
	node: TreeNode
	value?: BooleanValue
}

export const BooleanEditor = ({ node, value }: OwnProps) => {
	return (
		<Switch
			key={editorKey(node)}
			onChange={save(node, value)}
			defaultValue={value?.value.content}
		/>
	)
}
