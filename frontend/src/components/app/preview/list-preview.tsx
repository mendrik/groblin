import { ValueEditor } from '@/components/ui/values/value-editor'
import { Api } from '@/gql-client'
import type { Value } from '@/gql/graphql'
import { notNil } from '@/lib/signals'
import { cn } from '@/lib/utils'
import { $nodesMap, type TreeNode } from '@/state/tree'
import { $values, activePath } from '@/state/value'
import { evolveAlt } from '@shared/utils/evolve-alt'
import useSWR, { useSWRConfig } from 'swr'

import './list-preview.css'
import { useSignalEffect } from '@preact/signals-react'

type Request = {
	node_id: number
	list_path?: number[]
}

const useLoadItems = (request: Request) => {
	const { data } = useSWR(request, () => Api.GetListItems({ request }))
	return data as Exclude<typeof data, undefined>
}

type OwnProps = {
	node: TreeNode
}

const node = ({ node_id }: Value) => notNil($nodesMap, node_id)

export const ListPreview = ({ node: currentNode }: OwnProps) => {
	const request = {
		node_id: currentNode.id,
		list_path: activePath(currentNode)
	}
	const { mutate } = useSWRConfig()
	const data = useLoadItems(request).map(evolveAlt({ children: { node } }))
	useSignalEffect(() => {
		if ($values.value) {
			mutate(request)
		}
	})

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
