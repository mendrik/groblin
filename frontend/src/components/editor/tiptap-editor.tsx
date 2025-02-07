import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Align from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Underline as IconUnderline,
	Image,
	Italic,
	Redo,
	Undo,
	X
} from 'lucide-react'
import { MicroIcon } from '../ui/random/micro-icon'
import './tiptap-editor.css'

// Import table-related extensions from TipTap
import TableExtension from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { BackgroundButton } from './background-button'
import { BlockSelector } from './block-selector'
import { ColorButton } from './color-button'
import { FontSelector } from './font-selector'
import { LinkButton } from './link-button'
import { TableButton } from './table-button'

type OwnProps = {
	defaultValue?: string
	onChange?: (value: string) => any
}

const TiptapEditor = ({ defaultValue = '', onChange }: OwnProps) => {
	const editor = useEditor({
		extensions: [
			Align.configure({
				types: ['heading', 'paragraph', 'tableCell', 'tableHead']
			}),
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3, 4, 5, 6]
				}
			}),
			Underline,
			FontFamily,
			Color,
			Link,
			Highlight.configure({ multicolor: true }),
			TextStyle,
			// Add the table extensions
			TableExtension.configure({
				resizable: true
			}),
			TableRow,
			TableHeader,
			TableCell
		],
		onUpdate({ editor }) {
			onChange?.(editor.getHTML())
		},
		editorProps: {
			attributes: {
				class: 'focus:outline-none prose dark:prose-invert'
			}
		},
		content: defaultValue
	})

	if (!editor) {
		return null
	}

	// Determines the variant for toolbar icons based on active mark/node
	const variant = (name: string) =>
		editor.isActive(name) ? 'secondary' : 'ghost'

	return (
		<div className="w-full min-h-[calc(100vh-64px)] mb-10 mt-2">
			<div className="flex items-center gap-2 mb-8">
				<MicroIcon
					size={20}
					onClick={() => editor.chain().undo().run()}
					icon={Undo}
				/>
				<MicroIcon
					size={20}
					onClick={() => editor.chain().redo().run()}
					icon={Redo}
				/>
				<MicroIcon
					size={20}
					onClick={() => editor.chain().focus().unsetAllMarks().run()}
					icon={X}
				/>
				<MicroIcon
					size={20}
					variant={variant('bold')}
					onClick={() => editor.chain().focus().toggleBold().run()}
					icon={Bold}
				/>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={Italic}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				/>
				<MicroIcon
					size={20}
					variant={variant('underline')}
					icon={IconUnderline}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				/>
				<LinkButton editor={editor} />
				<BlockSelector editor={editor} />
				<FontSelector editor={editor} />
				<ColorButton editor={editor} />
				<BackgroundButton editor={editor} />
				<MicroIcon
					size={20}
					icon={AlignLeft}
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
				/>
				<MicroIcon
					size={20}
					icon={AlignCenter}
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
				/>
				<MicroIcon
					size={20}
					icon={AlignRight}
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
				/>
				<MicroIcon
					size={20}
					icon={AlignJustify}
					onClick={() => editor.chain().focus().setTextAlign('justify').run()}
				/>
				<TableButton editor={editor} />
				<MicroIcon
					size={20}
					icon={Image}
					onClick={() => alert('Image functionality not implemented yet')}
				/>
			</div>
			<EditorContent editor={editor} />
		</div>
	)
}

export default TiptapEditor
