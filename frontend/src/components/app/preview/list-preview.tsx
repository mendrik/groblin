import { Api } from '@/gql-client'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import {} from '@shared/utils/match'
import { memoizeWith } from 'ramda'
import { use } from 'react'

const loadItems = memoizeWith(
	n => `${activePath(n)?.join(',')}-${n.id}`,
	(node: TreeNode) =>
		Api.GetListItems({
			request: {
				node_id: node.id,
				list_path: activePath(node)
			}
		})
)

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node }: OwnProps) => {
	const items = use(loadItems(node))
	return <div>{items.length}</div>
}
