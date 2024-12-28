import { PreviewLoader } from '@/components/app/preview/preview-loader'
import { Api } from '@/gql-client'
import { job } from '@/lib/signals'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import { caseOf, match } from '@shared/utils/match'
import type { ReactNode } from 'react'
import { useEffectOnce } from 'react-use'
import { PreviewError } from './preview-error'

const loadItems = job((node: TreeNode) => {
	const lp = activePath(node)
	return Api.GetListItems({ request: { node_id: node.id, list_path: lp } })
})

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node }: OwnProps) => {
	useEffectOnce(() => loadItems.run(node))
	return match<[typeof loadItems], ReactNode>(
		caseOf([{ state: 'idle' }], null),
		caseOf([{ state: 'working' }], () => <PreviewLoader />),
		caseOf([{ state: 'error' } as const], ({ error }) => (
			<PreviewError error={error} />
		)),
		caseOf([{ state: 'done' } as const], ({ data }) => <div>{data.length}</div>)
	)(loadItems)
}
