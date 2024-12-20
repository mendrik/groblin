import type { NodeSettings } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'

type OwnProps = {
	node: TreeNode
	settings: NodeSettings | undefined
}
export const ListPreview = ({ node, settings }: OwnProps) => {
	return <div>list</div>
}
