import type { Editor } from '@tiptap/react'
import chroma from 'chroma-js'
import { PaintBucket } from 'lucide-react'
import { openColorPicker } from '../ui/color-picker'
import { MicroIcon } from '../ui/random/micro-icon'

type OwnProps = {
	editor: Editor
}

export const BackgroundButton = ({ editor }: OwnProps) => (
	<MicroIcon
		size={20}
		variant="ghost"
		icon={PaintBucket}
		onClick={() =>
			openColorPicker({
				color: 'rgba(0,0,0,1)',
				callback: color => {
					const hex = chroma.rgb(...color).hex()
					editor.chain().focus().setHighlight({ color: hex }).run()
				}
			})
		}
	/>
)
