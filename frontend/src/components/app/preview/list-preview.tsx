import type { ListItemValue } from '@/components/ui/values/list-editor'
import { ValueEditor, ViewContext } from '@/components/ui/values/value-editor'
import FocusTravel from '@/components/utils/focus-travel'
import { Api } from '@/gql-client'
import type { Value } from '@/gql/graphql'
import type { Node } from '@/gql/graphql.ts'
import { notNil } from '@/lib/signals'
import { cn } from '@/lib/utils'
import { $nodeSettingsMap } from '@/state/node-settings'
import { $nodes, $nodesMap, type TreeNode, asNode } from '@/state/tree'
import { $activePath, $values } from '@/state/value'
import { useSignalEffect } from '@preact/signals-react'
import { evolveAlt } from 'matchblade'
import { append, propEq, take } from 'ramda'
import { compact } from 'ramda-adjunct'
import { useDeepCompareEffect } from 'react-use'
import useSWR, { useSWRConfig } from 'swr'
import { ListItemActions } from './list-item-actions'
import './list-preview.css'
import type { PreviewProps } from './preview-panel'
type Request = {
	node_id: number
	list_path?: number[]
}

type EnhancedListValue = ListItemValue & {
	node: TreeNode
	children: Value[]
}

const useLoadItems = (request: Request) => {
	const node = ({ node_id }: Value) => notNil($nodesMap, node_id)
	const { data } = useSWR(request, () => Api.GetListItems({ request }))
	return (data ?? []).map(
		evolveAlt({ node, children: { node } })
	) as EnhancedListValue[]
}

const useLoadColumns = (nodeId: number, columns: number): Node[] => {
	const { data } = useSWR(`columns-${nodeId}`, () =>
		Api.GetListColumns({ node_id: nodeId })
	)
	return take(columns, data ?? [])
}

export default function ListPreview({
	node: currentNode,
	width
}: PreviewProps) {
	const { mutate } = useSWRConfig()
	const maxColumns = Math.floor(width / 120)
	const list_path = $activePath.value

	const request = {
		node_id: currentNode.id,
		list_path
	}
	const data = useLoadItems(request)
	const columns = useLoadColumns(currentNode.id, maxColumns)
	useSignalEffect(() => {
		const _ = [$values.value, $nodes.value, $nodeSettingsMap.value]
		mutate(request)
		mutate(`columns-${currentNode.id}`)
	})
	useDeepCompareEffect(() => {
		mutate(request)
	}, [list_path ?? []])

	return (
		<FocusTravel autoFocus={false}>
			<ol
				className="w-full table grid-lines mr-2 mt-10"
				style={{ '--columns': maxColumns }}
			>
				<li className="item sticky top-0 h-auto">
					<div />
					{columns.map(({ id, type, name }) => (
						<div key={id} className={cn('label', type)}>
							{name}
						</div>
					))}
				</li>
				{data.map(({ node, children, ...listValue }) => (
					<li key={listValue.id} className="item">
						<div className="options">
							<ListItemActions
								node={node}
								id={listValue.id}
								value={listValue}
							/>
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
										listPath={append(listValue.id, listValue.list_path ?? [])}
									/>
								</div>
							)
						})}
					</li>
				))}
			</ol>
		</FocusTravel>
	)
}
