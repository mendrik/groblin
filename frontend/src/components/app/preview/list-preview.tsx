import { ValueEditor, ViewContext } from '@/components/ui/values/value-editor'
import { Api } from '@/gql-client'
import type { Value } from '@/gql/graphql'
import { notNil } from '@/lib/signals'
import { cn } from '@/lib/utils'
import { $nodes, $nodesMap, type TreeNode, asNode } from '@/state/tree'
import { $values, activePath } from '@/state/value'
import { evolveAlt } from '@shared/utils/evolve-alt'
import useSWR, { useSWRConfig } from 'swr'

import './list-preview.css'
import type { Node } from '@/gql/graphql.ts'
import { $nodeSettings } from '@/state/node-settings'
import { useSignalEffect } from '@preact/signals-react'
import { append, propEq } from 'ramda'
import { compact } from 'ramda-adjunct'
import { ListItemActions } from './list-item-actions'
type Request = {
	node_id: number
	list_path?: number[]
}

const useLoadItems = (request: Request) => {
	const node = ({ node_id }: Value) => notNil($nodesMap, node_id)
	const { data } = useSWR(request, () => Api.GetListItems({ request }))
	return (data ?? []).map(evolveAlt({ node, children: { node } }))
}

const useLoadColumns = (nodeId: number): Node[] => {
	const { data } = useSWR(`columns-${nodeId}`, () =>
		Api.GetListColumns({ node_id: nodeId })
	)
	return data ?? []
}

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node: currentNode }: OwnProps) => {
	const { mutate } = useSWRConfig()
	const request = {
		node_id: currentNode.id,
		list_path: activePath(currentNode)
	}
	const data = useLoadItems(request)
	const columns = useLoadColumns(currentNode.id)
	useSignalEffect(() => {
		if ($values.value || $nodes.value || $nodeSettings.value) {
			mutate(request)
			mutate(`columns-${currentNode.id}`)
		}
	})

	return (
		<ol className="w-full table grid-lines">
			<li className="item">
				<div />
				{columns.map(({ id, type, name }) => (
					<div key={id} className={cn('label', type)}>
						{name}
					</div>
				))}
			</li>
			{data.map(({ id, value, node, children, list_path }) => (
				<li key={id} className="item">
					<div className="options">
						<ListItemActions node={node} id={id} value={value} />
					</div>
					{columns.map(node => {
						const value = children.find(propEq(node.id, 'node_id'))
						return (
							<div
								key={value?.id ?? node.id}
								className={cn('key-value', node.type)}
							>
								<ValueEditor
									node={asNode(node.id)}
									value={compact([value])}
									view={ViewContext.List}
									listPath={append(id, list_path ?? [])}
								/>
							</div>
						)
					})}
				</li>
			))}
		</ol>
	)
}
