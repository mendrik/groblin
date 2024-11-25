import type { Value } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
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
			className="ml-1"
			key={editorKey(node)}
			onCheckedChange={save(node, value)}
			defaultChecked={value?.value.content}
		/>
	)
}
