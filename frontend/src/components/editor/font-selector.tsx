import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import type { Editor } from '@tiptap/react'

type OwnProps = {
	editor: Editor
}

export const FontSelector = ({ editor }: OwnProps) => {
	const applyFont = (value: string) => {
		editor.chain().focus().setFontFamily(value).run()
	}

	return (
		<Select onValueChange={applyFont} value="">
			<SelectTrigger className="w-fit h-7">
				<SelectValue placeholder="Font" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Fonts</SelectLabel>
					<SelectItem value="serif">Serif</SelectItem>
					<SelectItem value="sans-serif">Sans Serif</SelectItem>
					<SelectItem value="monospace">Monospace</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	)
}
