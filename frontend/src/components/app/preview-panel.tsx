import type { NodeSettings } from '@/gql/graphql'
import { $nodeSettingsMap } from '@/state/node-settings'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { IconAlertCircle } from '@tabler/icons-react'
import { T as _ } from 'ramda'
import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

const matcher = match<[TreeNode, NodeSettings | undefined], ReactNode>(
	caseOf([_, _], 'preview panel')
)

const Warning = () => (
	<Alert variant="default" className="max-w-sm m-auto">
		<IconAlertCircle className="h-4 w-4" />
		<AlertTitle>Notice</AlertTitle>
		<AlertDescription>
			To activate the preview panel, select a node in the document tree.
		</AlertDescription>
	</Alert>
)

export const PreviewPanel = () => {
	const focusedNode = $focusedNode.value
	const settings = $nodeSettingsMap.value[focusedNode ?? 0]
	return (
		<div className="flex-1 min-h-svh p-2">
			{focusedNode ? matcher(asNode(focusedNode), settings) : <Warning />}
		</div>
	)
}
