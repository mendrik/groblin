import { caseOf, match } from '@shared/utils/match'
import TColor from '@tiptap/extension-color'
import type { Level } from '@tiptap/extension-heading'
import THighlight from '@tiptap/extension-highlight'
import TTextStyle from '@tiptap/extension-text-style'
import TUnderline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import chroma from 'chroma-js'
import {
	Baseline,
	Bold,
	Image,
	Italic,
	PaintBucket,
	Redo,
	Table,
	Underline,
	Undo,
	X
} from 'lucide-react' // Icons from Lucide (or any other icon library)
import { openColorPicker } from '../ui/color-picker'
import { MicroIcon } from '../ui/random/micro-icon'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '../ui/select'

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
					levels: [1, 2]
				}
			}),
			TColor,
			THighlight,
			TUnderline,
			TTextStyle
		],
		editorProps: {
			attributes: {
				class:
					'prose focus:outline-none dark:prose-invert [&_li]:my-0 [&_li>p]:my-0'
			}
		},
		content: '<p>Hello World!</p>'
	})

	if (!editor) {
		return null
	}

	const variant = (name: string) =>
		editor.isActive(name) ? 'secondary' : 'ghost'

	const applyMarkup = (value: string) => {}

	return (
		<div className="w-full min-h-[calc(100vh-64px)] mb-10 prose dark:prose-invert mt-2">
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
					icon={Underline}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				/>
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
							<SelectItem value="h2">H3</SelectItem>
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
				<Select onValueChange={applyMarkup}>
					<SelectTrigger className="w-fit h-7">
						<SelectValue placeholder="Font" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Serif</SelectLabel>
							<SelectItem value="h5">H5</SelectItem>
							<SelectItem value="h6">H6</SelectItem>
							<SelectLabel>Sans serif</SelectLabel>
							<SelectItem value="p">Blockquote</SelectItem>
							<SelectItem value="code">Code block</SelectItem>
							<SelectLabel>Monospace</SelectLabel>
							<SelectItem value="quote">Blockquote</SelectItem>
							<SelectItem value="P">Code block</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<MicroIcon
					size={20}
					variant="ghost"
					icon={Baseline}
					style={{
						backgroundColor: editor.isActive('color')
							? editor.getAttributes('textStyle').color
							: undefined
					}}
					onClick={() =>
						openColorPicker({
							color: 'rgba(0,0,0,1)',
							callback: color => {
								const hex = chroma.rgb.apply(null, color).hex()
								editor.chain().focus().setColor(hex).run()
							}
						})
					}
				/>
				<MicroIcon
					size={20}
					variant="ghost"
					icon={PaintBucket}
					onClick={() =>
						openColorPicker({
							color: 'rgba(0,0,0,1)',
							callback: color => {
								const hex = chroma.rgb.apply(null, color).hex()
								console.log(hex)

								editor.chain().focus().setHighlight({ color: hex }).run()
							}
						})
					}
				/>
				<MicroIcon
					size={20}
					variant="ghost"
					icon={Table}
					onClick={() => alert('todo')}
				/>
				<MicroIcon
					size={20}
					variant="ghost"
					icon={Image}
					onClick={() => alert('todo')}
				/>
			</div>
			<EditorContent editor={editor} />
		</div>
	)
}

export default TiptapEditor
