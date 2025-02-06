import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { caseOf, match } from '@shared/utils/match'
import type { Editor } from '@tiptap/react'

type OwnProps = {
	editor: Editor
}

export const BlockSelector = ({ editor }: OwnProps) => {
	// Applies block markup commands such as heading, paragraph, lists, etc.
	const applyMarkup = match<[string], boolean>(
		caseOf(['p'], () => editor.chain().focus().setParagraph().run()),
		caseOf(['h1'], () =>
			editor.chain().focus().toggleHeading({ level: 1 }).run()
		),
		caseOf(['h2'], () =>
			editor.chain().focus().toggleHeading({ level: 2 }).run()
		),
		caseOf(['h3'], () =>
			editor.chain().focus().toggleHeading({ level: 3 }).run()
		),
		caseOf(['h4'], () =>
			editor.chain().focus().toggleHeading({ level: 4 }).run()
		),
		caseOf(['h5'], () =>
			editor.chain().focus().toggleHeading({ level: 5 }).run()
		),
		caseOf(['h6'], () =>
			editor.chain().focus().toggleHeading({ level: 6 }).run()
		),
		caseOf(['ul'], () => editor.chain().focus().toggleBulletList().run()),
		caseOf(['ol'], () => editor.chain().focus().toggleOrderedList().run()),
		caseOf(['quote'], () => editor.chain().focus().toggleBlockquote().run()),
		caseOf(['code'], () => editor.chain().focus().toggleCodeBlock().run())
	)

	return (
		<Select onValueChange={applyMarkup} value="">
			<SelectTrigger className="w-fit h-7">
				<SelectValue placeholder="Section" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Common</SelectLabel>
					<SelectItem value="p">Paragraph</SelectItem>
					<SelectItem value="h1">H1</SelectItem>
					<SelectItem value="h2">H2</SelectItem>
					<SelectItem value="h3">H3</SelectItem>
					<SelectItem value="ul">Bullet list</SelectItem>
					<SelectLabel>Miscellaneous</SelectLabel>
					<SelectItem value="ol">Ordered list</SelectItem>
					<SelectItem value="quote">Blockquote</SelectItem>
					<SelectItem value="code">Code block</SelectItem>
					<SelectLabel>Headings</SelectLabel>
					<SelectItem value="h4">H4</SelectItem>
					<SelectItem value="h5">H5</SelectItem>
					<SelectItem value="h6">H6</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	)
}
