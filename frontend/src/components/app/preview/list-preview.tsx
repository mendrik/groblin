jhilimport { Api } from '@/gql-client'
import { $nodesMap, type TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import useSWR from 'swr'
import './list-preview.css'
import { Api } from '@/gql-client'
import type { Value } from '@/gql/graphql'
import { notNil } from '@/lib/signals'
import { $nodeSettings } from '@/state/node-settings'
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


/**
 * 
 * 
 */


export const ListPreview = ({ node }: OwnProps) => {
	const data = useLoadItems(node).map(
		evolveAlt({
			children: {
						node: ({ node_id }: Value) => notNil($nodesMap, node_id),
						settings: ({ node_id }: Value) => $nodeSettings.value[node_id]
					}
		})
	)


	return (
		<ol>
			{data.map(({ id, children }) => (
				<li key={id} className="item">
					{children.map(({ node_id, node, settings, value }) => (
						<div key={node.} className="item">
							{node.value}
						</div>
					))}
				</li>
			))}
		</ol>
	)
}
