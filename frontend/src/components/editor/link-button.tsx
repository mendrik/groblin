import { EditorType } from '@shared/enums'
import type { Editor } from '@tiptap/react'
import { LinkIcon } from 'lucide-react'
import { object } from 'zod/v4'
import { MicroIcon } from '../ui/random/micro-icon'
import { openInputDialog } from '../ui/simple/input-dialog'
import { stringField } from '../ui/zod-form/utils'

const UrlInput = object({
	url: stringField('Url', EditorType.Input, '', 'https://example.com')
})

type OwnProps = {
	editor: Editor
}

export const LinkButton = ({ editor }: OwnProps) => {
	return (
		<MicroIcon
			size={20}
			variant={editor.isActive('link') ? 'secondary' : 'ghost'}
			icon={LinkIcon}
			onClick={() => {
				const url: string = editor.getAttributes('link').href ?? ''
				openInputDialog({
					title: 'Edit link',
					defaultValues: { url },
					schema: UrlInput,
					callback: ({ url }) => {
						const r = editor.chain().focus().extendMarkRange('link')
						if (!url) {
							r.unsetLink().run()
						} else {
							r.setLink({ href: url }).run()
						}
					}
				})
			}}
		/>
	)
}
