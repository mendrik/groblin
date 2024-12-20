import { Api } from '@/gql-client'
import type { NodeSettings } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import { signal } from '@preact/signals-react'
import { useEffect } from 'react'

type OwnProps = {
	node: TreeNode
	settings: NodeSettings | undefined
}

const $items = signal([])

export const ListPreview = ({ node, settings }: OwnProps) => {
	useEffect(() => {
		const lp = activePath(node)
		Api.GetListItems({ request: { node_id: node.id, list_path: lp } })
	}, [node])
	return <div>list</div>
}
