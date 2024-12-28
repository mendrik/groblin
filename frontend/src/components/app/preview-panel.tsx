import { NodeType } from '@/gql/graphql'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { caseOf, match } from '@shared/utils/match'
import { IconAlertCircle, IconSettings } from '@tabler/icons-react'
import { Maybe } from 'purify-ts'
import { T as _ } from 'ramda'
import { type ReactNode, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { ListPreview } from '../ui/previews/list-preview'

export const $previewPanel = signal<ReactNode>(null)

const Warning = () => (
	<Alert variant="default" className="max-w-sm m-auto">
		<IconAlertCircle className="h-6 w-6 mr-8" stroke={1} />
		<AlertTitle className="!pl-10">Notice</AlertTitle>
		<AlertDescription className="!pl-10">
			To activate the preview panel, select a node in the document tree.
		</AlertDescription>
	</Alert>
)

const Loader = () => (
	<div className="flex w-full justify-center items-center">
		<IconSettings className="h-8 w-8 animate-spin" stroke={0.5} />
	</div>
)

const NoSupport = () => (
	<Alert variant="default" className="max-w-sm m-auto">
		<IconAlertCircle className="h-6 w-6 mr-8" stroke={1} />
		<AlertTitle className="!pl-10">Information</AlertTitle>
		<AlertDescription className="!pl-10">
			For this node type there is no preview panel available.
		</AlertDescription>
	</Alert>
)

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
			<ErrorBoundary fallback={<Warning />}>
				<Suspense fallback={<Loader />}>
					{node.caseOf({
						Just: node => <Panel node={node} />,
						Nothing: () => null
					})}{' '}
				</Suspense>
			</ErrorBoundary>
		</div>
	)
}
