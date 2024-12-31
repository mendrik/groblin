import { NodeType } from '@/gql/graphql'
import useResize from '@/hooks/use-resize'
import { $focusedNode, type TreeNode, asNode } from '@/state/tree'
import { $activeListItems } from '@/state/value'
import { caseOf, match } from '@shared/utils/match'
import { Maybe } from 'purify-ts'
import { T as _ } from 'ramda'
import {
	type ReactNode,
	Suspense,
	createContext,
	useEffect,
	useRef,
	useState
} from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { SWRConfig } from 'swr'
import {} from '../../ui/alert'
import { ListPreview } from './list-preview'
import { NoSupport } from './no-support'
import { PreviewLoader } from './preview-loader'
import { SelectInfo } from './select-info'

const toPreviewPanel = match<[TreeNode], ReactNode>(
	caseOf([{ type: NodeType.List }], node => <ListPreview node={node} />),
	caseOf([_], () => <NoSupport />)
)

export const CssContext = createContext({
	columns: 0
})

export const PreviewPanel = () => {
	const ref = useRef<HTMLDivElement>(null)
	const [columns, setColumns] = useState(0)
	const Panel = Maybe.fromNullable($focusedNode.value)
		.map(asNode)
		.map(toPreviewPanel)
		.extract()

	const fetchColumnCount = () => {
		if (ref.current) {
			const columns = getComputedStyle(ref.current).getPropertyValue(
				'--columns'
			)
			setColumns(Number.parseInt(columns))
		}
	}

	const { width } = useResize(ref)

	// biome-ignore lint/correctness/useExhaustiveDependencies: run on width change
	useEffect(() => fetchColumnCount(), [width])

	return (
		<div
			className="flex flex-1 min-h-svh w-full"
			key={JSON.stringify($activeListItems.value)}
			ref={ref}
			onResize={fetchColumnCount}
		>
			<CssContext.Provider value={{ columns }}>
				<ErrorBoundary fallback={<SelectInfo />} onError={console.error}>
					<SWRConfig
						value={{
							suspense: true,
							onError: (err, key) => {
								throw err
							}
						}}
					>
						<Suspense fallback={<PreviewLoader />}>{Panel}</Suspense>
					</SWRConfig>
				</ErrorBoundary>
			</CssContext.Provider>
		</div>
	)
}
