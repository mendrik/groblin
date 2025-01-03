import { ValueEditor, ViewContext } from '@/components/ui/values/value-editor'
import { Api } from '@/gql-client'
import type { ListItem, Value } from '@/gql/graphql'
import { notNil } from '@/lib/signals'
import { cn } from '@/lib/utils'
import { $nodes, $nodesMap, type TreeNode, asNode } from '@/state/tree'
import { $values, activePath } from '@/state/value'
import { evolveAlt } from '@shared/utils/evolve-alt'
import useSWR, { useSWRConfig } from 'swr'

import type { ColorValue } from '@/components/ui/values/color-editor'
import FocusTravel from '@/components/utils/focus-travel'
import type { Node } from '@/gql/graphql.ts'
import { $nodeSettingsMap } from '@/state/node-settings'
import { useSignalEffect } from '@preact/signals-react'
import { rgb } from 'chroma-js'
import { append, propEq, take } from 'ramda'
import { compact } from 'ramda-adjunct'
import { ListItemActions } from './list-item-actions'
import './list-preview.css'
type Request = {
	node_id: number
	list_path?: number[]
}

const rowColor = ({ children }: ListItem) => {
	const rowColorChild: ColorValue | undefined = children.find(
		({ node_id }) =>
			$nodeSettingsMap.value[node_id]?.settings?.colorRows === true
	)
	const rgba = rowColorChild?.value.rgba
	return rgba ? rgb.apply(null, rgba ?? [0, 0, 0]).css() : 'transparent'
}

const useLoadItems = (request: Request) => {
	const node = ({ node_id }: Value) => notNil($nodesMap, node_id)
	const { data } = useSWR(request, () => Api.GetListItems({ request }))
	return (data ?? []).map(evolveAlt({ node, rowColor, children: { node } }))
}

const useLoadColumns = (nodeId: number, columns: number): Node[] => {
	const { data } = useSWR(`columns-${nodeId}`, () =>
		Api.GetListColumns({ node_id: nodeId })
	)
	return take(columns, data ?? [])
}

type OwnProps = {
	node: TreeNode
	width: number
}

export const ListPreview = ({ node: currentNode, width }: OwnProps) => {
	const { mutate } = useSWRConfig()
	const maxColumns = Math.floor(width / 150)
	const request = {
		node_id: currentNode.id,
		list_path: activePath(currentNode)
	}
	const data = useLoadItems(request)
	const columns = useLoadColumns(currentNode.id, maxColumns)
	useSignalEffect(() => {
		if ($values.value || $nodes.value || $nodeSettingsMap.value) {
			console.log('mutating')

			mutate(request)
			mutate(`columns-${currentNode.id}`)
		}
	})

	return (
		<FocusTravel autoFocus={false}>
			<ol
				className="w-full table grid-lines mr-2"
				style={{ '--columns': maxColumns }}
			>
				<li className="item">
					<div />
					{columns.map(({ id, type, name }) => (
						<div key={id} className={cn('label', type)}>
							{name}
						</div>
					))}
				</li>
				{data.map(({ id, value, node, rowColor, children, list_path }) => (
					<li key={id} className="item" style={{ '--row-color': rowColor }}>
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
		</FocusTravel>
	)
}
