import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageLoader } from '@/components/ui/random/image-loader'
import { WiggleMicroIcon } from '@/components/ui/random/wiggle-micro-icon'
import { Icon } from '@/components/ui/simple/icon'
import { $valueMap, deleteValue } from '@/state/value'
import type { MediaType } from '@shared/json-value-types'
import { Paperclip, Trash } from 'lucide-react'
import { Maybe } from 'purify-ts'
import { prop } from 'ramda'
import type { PreviewProps } from './preview-panel'

export default function MediaPreview({ node }: PreviewProps) {
	const value = Maybe.fromNullable($valueMap.value[node.id]?.[0])
	const media = value.map<MediaType>(v => v.value)

	return (
		<div className="w-full h-screen justify-center items-center flex relative">
			{media.mapOrDefault(
				m => (
					<>
						<WiggleMicroIcon
							icon={Trash}
							onClick={() => value.map(prop('id')).ifJust(deleteValue)}
							className="absolute right-1 top-8"
						/>
						<Card className="w-[300px]">
							<CardHeader>
								<CardTitle className="text-ellipsis overflow-hidden">
									{m.name}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex justify-center items-center">
								{m.contentType.startsWith('image') ? (
									<ImageLoader src={m.url} key={m.name} />
								) : (
									<Button
										key={m.name}
										className="flex flex-row gap-2"
										onClick={() => m.url && window.open(m.url, '_blank')}
									>
										<Icon icon={Paperclip} size={18} />
										<div>Download</div>
									</Button>
								)}
							</CardContent>
						</Card>
					</>
				),
				null
			)}
		</div>
	)
}
