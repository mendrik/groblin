import { ValueEditor } from '@/components/ui/values/value-editor'
import { Api } from '@/gql-client'
import type { Value } from '@/gql/graphql'
import { notNil } from '@/lib/signals'
import { cn } from '@/lib/utils'
import { $nodesMap, type TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import { evolveAlt } from '@shared/utils/evolve-alt'
import useSWR from 'swr'

import './list-preview.css'

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
		<ol className="w-full table grid-lines">
			{data.map(({ id, children }) => (
				<li key={id} className="item">
					{children.slice(0, 10).map(({ node, ...value }) => (
						<div key={value.id} className={cn('key-value', node.type)}>
							<div className="label">{node.name}</div>
							<div className="editor">
								<ValueEditor node={node} value={[value]} />
							</div>
						</div>
					))}
				</li>
			))}
		</ol>
	)
}
