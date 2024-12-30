import { $nodesMap, type TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import useSWR from 'swr'
import './list-preview.css'
import { ValueEditor } from '@/components/ui/values/value-editor'
import { Api } from '@/gql-client'
import type { Value } from '@/gql/graphql'
import { notNil } from '@/lib/signals'
import { evolveAlt } from '@shared/utils/evolve-alt'

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

const node = ({ node_id }: Value) => notNil($nodesMap, node_id)

export const ListPreview = ({ node: currentNode }: OwnProps) => {
	const data = useLoadItems(currentNode).map(evolveAlt({ children: { node } }))
	return (
		<ol className="w-full divide-y divide-gray-200">
			{data.map(({ id, children }) => (
				<li key={id} className="item">
					{children.map(({ node, value, id }) => (
						<div key={id} className="item">
							<div>{node.name}</div>
							<ValueEditor node={node} value={[value]} />
						</div>
					))}
				</li>
			))}
		</ol>
	)
}
