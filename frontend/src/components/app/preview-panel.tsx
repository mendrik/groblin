import type { NodeSettings } from '@/gql/graphql'
import { $nodeSettingsMap } from '@/state/node-settings'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { T as _ } from 'ramda'
import type { ReactNode } from 'react'

const matcher = match<[TreeNode, NodeSettings | undefined], ReactNode>(
	caseOf([_, _], 'preview panel')
)

export const PreviewPanel = () => {
	const focusedNode = $focusedNode.value
	if (!focusedNode) return <div>Select a node</div>
	const settings = $nodeSettingsMap.value[focusedNode]
	return (
		<div className="flex-1 min-h-svh p-2">
			{matcher(asNode(focusedNode), settings)}
		</div>
	)
}
