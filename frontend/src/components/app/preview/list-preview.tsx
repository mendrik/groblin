import { PreviewLoader } from '@/components/app/preview/preview-loader'
import { Api } from '@/gql-client'
import { job } from '@/lib/signals'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import { effect } from '@preact/signals-react'
import { caseOf, match } from '@shared/utils/match'
import { type ReactNode, useEffect } from 'react'
import { PreviewError } from './preview-error'

const loadItems = job((node: TreeNode) => {
	const lp = activePath(node)
	return Api.GetListItems({ request: { node_id: node.id, list_path: lp } })
})

effect(() => {
	console.log(loadItems.state)
	if (loadItems.state === 'error') {
		console.error(loadItems.error)
	}
})

type OwnProps = {
	node: TreeNode
}

export const ListPreview = ({ node }: OwnProps) => {
	useEffect(() => loadItems.run(node), [node])
	return match<[typeof loadItems], ReactNode>(
		caseOf([{ state: 'idle' }], null),
		caseOf([{ state: 'error' }], ({ error }) => <PreviewError error={error} />),
		caseOf([{ state: 'working' }], () => <PreviewLoader />),
		caseOf([{ state: 'done' }], ({ data }) => <div>{data.length}</div>)
	)
}
