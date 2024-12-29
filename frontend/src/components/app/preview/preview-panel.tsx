import { NodeType } from '@/gql/graphql'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { Maybe } from 'purify-ts'
import { T as _ } from 'ramda'
import { type ReactNode, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {} from '../../ui/alert'
import { ListPreview } from './list-preview'
import { NoSupport } from './no-support'
import { PreviewLoader } from './preview-loader'
import { SelectInfo } from './select-info'

const toPreviewPanel = match<[TreeNode], ReactNode>(
	caseOf([{ type: NodeType.List }], node => <ListPreview node={node} />),
	caseOf([_], () => <NoSupport />)
)

export const PreviewPanel = () => {
	const Panel = Maybe.fromNullable($focusedNode.value)
		.map(asNode)
		.map(toPreviewPanel)
		.extract()

	return (
		<div className="flex flex-1 min-h-svh p-2 w-full">
			<ErrorBoundary fallback={<SelectInfo />}>
				<Suspense fallback={<PreviewLoader />}>{Panel}</Suspense>
			</ErrorBoundary>
		</div>
	)
}
