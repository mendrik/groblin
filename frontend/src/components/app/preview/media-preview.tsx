import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WiggleMicroIcon } from '@/components/ui/random/wiggle-micro-icon'
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
				<WiggleMicroIcon
					icon={Trash}
					onClick={() => void 0}
					className="absolute right-1 top-1"
				/>
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
