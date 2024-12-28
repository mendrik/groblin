import { Api } from '@/gql-client'
import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import { use } from 'react'

const loadItems = async (node: TreeNode) => {
	if (node.type === NodeType.List) return []
	const lp = activePath(node)
	return Api.GetListItems({ request: { node_id: node.id, list_path: lp } })
}

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node }: OwnProps) => {
	const items = use(loadItems(node))
	return <div>{items.length}</div>
}
