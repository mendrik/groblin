import { Api } from '@/gql-client'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import useSWR from 'swr'

const useLoadItems = (node: TreeNode) => {
	const request = {
		node_id: node.id,
		list_path: activePath(node)
	}
	const { data } = useSWR(request, () => Api.GetListItems({ request }))
	return data as Exclude<typeof data, undefined>
}

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node }: OwnProps) => {
	const data = useLoadItems(node)
	return <div>{data.length}</div>
}
