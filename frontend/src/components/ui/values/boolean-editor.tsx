import type { Value } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { objOf, pipe } from 'ramda'
import { Switch } from '../switch'
import { editorKey, save } from './value-editor'

type BooleanValue = Value & { value: { state: boolean } }

type OwnProps = {
	node: TreeNode
	value?: BooleanValue
	listPath: number[]
}

export const BooleanEditor = ({ node, value, listPath }: OwnProps) => {
	const saveNewValue = pipe(objOf('state'), save(node, listPath, value))
	return (
		<Switch
			key={editorKey(node, value)}
			onCheckedChange={saveNewValue}
			defaultChecked={value?.value.state}
		/>
	)
}
