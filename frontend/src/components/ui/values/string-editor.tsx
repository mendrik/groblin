import type { Value } from '@/gql/graphql'
import { inputValue } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import { listPath, saveValue } from '@/state/value'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { pipeAsync } from '@shared/utils/pipe-async'
import {} from '@tabler/icons-react'
import { objOf } from 'ramda'

type StringValue = Value & { value: { content: string } }

type OwnProps = {
	node: TreeNode
	value?: StringValue
}

const save = (node: TreeNode, value?: StringValue) =>
	pipeAsync(
		inputValue,
		evolveAlt({
			value: objOf('content'),
			node_id: () => node.id,
			id: () => value?.id,
			list_path: () => listPath(node)
		}),
		saveValue
	)

export const StringEditor = ({ node, value }: OwnProps) => {
	const path = listPath(node)
	return (
		<input
			key={`${node.id}-${path?.join('-')}`}
			className="h-7 bg-transparent border-none appearance-none outline-none ring-0 ml-1"
			defaultValue={value?.value.content}
			onBlur={save(node, value)}
		/>
	)
}
