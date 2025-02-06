import { caseOf, match } from '@shared/utils/match'
import Color from '@tiptap/extension-color'
import type { Level } from '@tiptap/extension-heading'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
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

const levelForHeading = match<[string], Level>(
	caseOf(['H1'], 1),
	caseOf(['H2'], 2),
	caseOf(['H3'], 3),
	caseOf(['H4'], 4),
	caseOf(['H5'], 5),
	caseOf(['H6'], 6)
)

const TiptapEditor = () => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3, 4, 5, 6]
				}
			}),
			Underline,
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
		editorProps: {
			attributes: {
				class: 'focus:outline-none prose dark:prose-invert'
			}
		},
		content: '<p>Hello World!</p>'
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
					variant="ghost"
					onClick={() => editor.chain().undo().run()}
					icon={Undo}
				/>
				<MicroIcon
					size={20}
					variant="ghost"
					onClick={() => editor.chain().redo().run()}
					icon={Redo}
				/>
				<MicroIcon
					size={20}
					variant="ghost"
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
				<TableButton editor={editor} />
				<MicroIcon
					size={20}
					variant="ghost"
					icon={Image}
					onClick={() => alert('Image functionality not implemented yet')}
				/>
			</div>
			<EditorContent editor={editor} />
		</div>
	)
}

export default TiptapEditor
