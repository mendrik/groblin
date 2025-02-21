import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageLoader } from '@/components/ui/random/image-loader'
import { WiggleMicroIcon } from '@/components/ui/random/wiggle-micro-icon'
import { Icon } from '@/components/ui/simple/icon'
import { $valueMap, deleteValue } from '@/state/value'
import { encryptInteger } from '@shared/utils/number-hash'
import { url } from '@shared/utils/url'
import { Paperclip, Trash } from 'lucide-react'
import { Maybe } from 'purify-ts'
import type { PreviewProps } from './preview-panel'

const mediaUrl = import.meta.env.VITE_MEDIA_URL

export default function MediaPreview({ node }: PreviewProps) {
	const value = Maybe.fromNullable($valueMap.value[node.id]?.[0])

	return (
		<div className="w-full h-screen justify-center items-center flex relative">
			{value.mapOrDefault(
				v => (
					<>
						<WiggleMicroIcon
							icon={Trash}
							onClick={() => deleteValue(v.id)}
							className="absolute right-1 top-8"
						/>
						<Card className="w-[300px]">
							<CardHeader>
								<CardTitle className="text-ellipsis overflow-hidden">
									{v.value.name}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex justify-center items-center">
								{v.value.contentType.startsWith('image') ? (
									<ImageLoader
										src={url`${mediaUrl}/${encryptInteger(v.id)}?size=640&v=${v.updated_at}`}
										key={v.value.name}
									/>
								) : (
									<Button
										key={v.value.name}
										className="flex flex-row gap-2"
										onClick={() =>
											window.open(
												url`${mediaUrl}/${encryptInteger(v.id)}`,
												'_blank'
											)
										}
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
