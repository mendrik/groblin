import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TreeNode } from '@/state/tree'
import { $valueMap, activePath } from '@/state/value'
import type { MediaType } from '@shared/json-value-types'
type OwnProps = {
	node: TreeNode
}

export default function MediaPreview({ node }: OwnProps) {
	const value: MediaType | undefined = $valueMap.value[node.id]?.[0]?.value
	const listPath = activePath(node)
	// todo load media

	return (
		<div className="w-full h-screen justify-center items-center flex">
			<Card className="w-[300px]">
				<CardHeader>
					<CardTitle>
						{value?.name} {node.id}
					</CardTitle>
				</CardHeader>
				<CardContent>Hallo</CardContent>
			</Card>
		</div>
	)
}
