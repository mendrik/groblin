import { NodeType } from '@/gql/graphql'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { caseOf, match } from '@shared/utils/match'
import { Maybe } from 'purify-ts'
import { T as _ } from 'ramda'
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {} from '../../ui/alert'
import { ListPreview } from './list-preview'
import { NoSupport } from './no-support'
import { SelectInfo } from './select-info'

export const $previewPanel = signal<ReactNode>(null)

const Panel = match<[{ node: TreeNode }], ReactNode>(
	caseOf([{ node: { type: NodeType.List } }], ({ node }) => (
		<ListPreview node={node} />
	)),
	caseOf([_], () => <NoSupport />)
)

export const PreviewPanel = () => {
	const node = Maybe.fromNullable($focusedNode.value).map(asNode)
	return (
		<div className="flex flex-1 min-h-svh p-2 w-full">
			<ErrorBoundary fallback={<SelectInfo />}>
				{node.caseOf({
					Just: node => <Panel node={node} />,
					Nothing: () => null
				})}{' '}
			</ErrorBoundary>
		</div>
	)
}
