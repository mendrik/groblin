import { NodeType, type Value } from '@/gql/graphql'
import { $focusedNode, $nodesMap, type TreeNode, asNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { T as _ } from 'ramda'
import { type ExoticComponent, Suspense, lazy } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { SWRConfig } from 'swr'
import { PreviewLoader } from './preview-loader'
import { SelectInfo } from './select-info'

const ListPreview = lazy(() => import('./list-preview'))
const ArticlePreview = lazy(() => import('./article-preview'))
const MediaPreview = lazy(() => import('./media-preview'))
const NoSupport = lazy(() => import('./no-support'))

export type PreviewProps = {
	node: TreeNode
	values: Value[]
	width: number
}

const toPreviewPanel = match<
	[TreeNode],
	ExoticComponent<{ node: TreeNode; values: Value[]; width: number }>
>(
	caseOf([{ type: NodeType.List }], () => ListPreview),
	caseOf([{ type: NodeType.Article }], () => ArticlePreview),
	caseOf([{ type: NodeType.Media }], () => MediaPreview),
	caseOf([_], () => NoSupport)
)

type OwnProps = {
	width: number
}

export const PreviewPanel = ({ width }: OwnProps) => {
	const nodeId = $focusedNode.value
	if (!nodeId || $nodesMap.value[nodeId] == null) return <SelectInfo />
	const node = asNode(nodeId)
	const Panel = toPreviewPanel(node)

	return (
		<div className="flex flex-1 h-full w-full items-start px-4">
			<ErrorBoundary fallback={<SelectInfo />} onError={console.error}>
				<SWRConfig
					value={{
						suspense: true
					}}
				>
					<Suspense fallback={<PreviewLoader />}>
						{width !== 0 && <Panel node={node} width={width} values={[]} />}
					</Suspense>
				</SWRConfig>
			</ErrorBoundary>
		</div>
	)
}
