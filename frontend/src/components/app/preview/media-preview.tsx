import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { $valueMap, activePath } from '@/state/value'
import type { MediaType } from '@shared/json-value-types'
import { Trash } from 'lucide-react'
import type { PreviewProps } from './preview-panel'

export default function MediaPreview({ node }: PreviewProps) {
	const value: MediaType | undefined = $valueMap.value[node.id]?.[0]?.value
	const listPath = activePath(node)
	// todo load media

	return (
		<div className="w-full h-screen justify-center items-center flex">
			<Card className="w-[300px] relative">
				<Button
					variant="outline"
					size="icon"
					className="absolute top-2 right-2"
				>
					<Trash className="h-4 w-4" />
				</Button>
				<CardHeader>
					<CardTitle className="text-center">{value?.name}</CardTitle>
				</CardHeader>
				<CardContent>
					<img className={cn('h-auto w-full')} src={value?.url} alt="" />
				</CardContent>
			</Card>
		</div>
	)
}
