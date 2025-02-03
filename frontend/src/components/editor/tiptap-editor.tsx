import { caseOf, match } from '@shared/utils/match'
import type { Level } from '@tiptap/extension-heading'
import { type ChainedCommands, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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
import { invoker } from 'ramda'
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
			})
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

	const command = (command: keyof ChainedCommands) => {
		invoker(0, command)(editor.chain().focus()).run()
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
					onClick={() => command('unsetAllMarks')}
					icon={Undo}
				/>
				<MicroIcon
					size={20}
					variant={variant('bold')}
					onClick={() => command('toggleBold')}
					icon={Redo}
				/>
				<MicroIcon
					size={20}
					variant="ghost"
					onClick={() => command('unsetAllMarks')}
					icon={X}
				/>
				<MicroIcon
					size={20}
					variant={variant('bold')}
					onClick={() => command('toggleBold')}
					icon={Bold}
				/>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={Italic}
					onClick={() => command('toggleItalic')}
				/>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={Underline}
					onClick={() => command('toggleItalic')}
				/>
				<Select onValueChange={applyMarkup} value="">
					<SelectTrigger className="w-fit h-7">
						<SelectValue placeholder="Section" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Common</SelectLabel>
							<SelectItem value="P">Paragraph</SelectItem>
							<SelectItem value="h1">H1</SelectItem>
							<SelectItem value="h2">H2</SelectItem>
							<SelectItem value="h2">H3</SelectItem>
							<SelectItem value="P">Bullet list</SelectItem>
							<SelectLabel>Miscellaneous</SelectLabel>
							<SelectItem value="P">Ordered list</SelectItem>
							<SelectItem value="P">Blockquote</SelectItem>
							<SelectItem value="P">Code block</SelectItem>
							<SelectLabel>Headings</SelectLabel>
							<SelectItem value="h4">H4</SelectItem>
							<SelectItem value="h5">H5</SelectItem>
							<SelectItem value="h6">H6</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<Select onValueChange={applyMarkup} value="">
					<SelectTrigger className="w-fit h-7">
						<SelectValue placeholder="Font" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Serif</SelectLabel>
							<SelectItem value="h5">H5</SelectItem>
							<SelectItem value="h6">H6</SelectItem>
							<SelectLabel>Sans serif</SelectLabel>
							<SelectItem value="P">Blockquote</SelectItem>
							<SelectItem value="P">Code block</SelectItem>
							<SelectLabel>Monospace</SelectLabel>
							<SelectItem value="P">Blockquote</SelectItem>
							<SelectItem value="P">Code block</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={Baseline}
					onClick={() => command('toggleItalic')}
				/>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={PaintBucket}
					onClick={() => command('toggleItalic')}
				/>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={Table}
					onClick={() => command('toggleItalic')}
				/>
				<MicroIcon
					size={20}
					variant={variant('italic')}
					icon={Image}
					onClick={() => command('toggleItalic')}
				/>
			</div>
			<EditorContent editor={editor} />
		</div>
	)
}

export default TiptapEditor
