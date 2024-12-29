import { Api } from '@/gql-client'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import {} from '@shared/utils/match'
import { cache, use } from 'react'

const loadItems = cache((node: TreeNode) => {
	const lp = activePath(node)
	return Api.GetListItems({ request: { node_id: node.id, list_path: lp } })
})

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node }: OwnProps) => {
	const items = use(loadItems(node))
	return <div>{items.length}</div>
}
