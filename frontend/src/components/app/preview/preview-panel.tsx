import { NodeType } from '@/gql/graphql'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { T as _ } from 'ramda'
import { type ReactNode, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { SWRConfig } from 'swr'
import { ListPreview } from './list-preview'
import { NoSupport } from './no-support'
import { PreviewLoader } from './preview-loader'
import { SelectInfo } from './select-info'

const toPreviewPanel = match<[TreeNode], (a: any) => ReactNode>(
	caseOf([{ type: NodeType.List }], () => ListPreview),
	caseOf([_], () => NoSupport)
)

type OwnProps = {
	width: number
}

export const PreviewPanel = ({ width }: OwnProps) => {
	const nodeId = $focusedNode.value
	if (!nodeId) return <SelectInfo />
	const node = asNode(nodeId)
	const Panel = toPreviewPanel(node)

	return (
		<div className="flex flex-1 h-full w-full items-start">
			<ErrorBoundary fallback={<SelectInfo />} onError={console.error}>
				<SWRConfig
					value={{
						suspense: true,
						onError: (err, key) => {
							throw err
						}
					}}
				>
					<Suspense fallback={<PreviewLoader />}>
						{width !== 0 && <Panel node={node} width={width} />}
					</Suspense>
				</SWRConfig>
			</ErrorBoundary>
		</div>
	)
}
