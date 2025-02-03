import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered } from 'lucide-react' // Icons from Lucide (or any other icon library)
import { MicroIcon } from '../ui/random/micro-icon'

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
					'prose prose-sm focus:outline-none dark:prose-invert [&_li]:my-0 [&_li>p]:my-0'
			}
		},
		content: '<p>Hello World!</p>'
	})

	if (!editor) {
		return null
	}

	return (
		<div className="w-full min-h-[calc(100vh-64px)] mb-10 prose dark:prose-invert mt-2">
			<div className="flex gap-2 mb-8">
				<MicroIcon
					size={20}
					variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
					onClick={() => editor.chain().focus().toggleBold().run()}
					icon={Bold}
				/>
				<MicroIcon
					size={20}
					variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
					icon={Italic}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				/>
				<MicroIcon
					size={20}
					variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					icon={List}
				/>
				<MicroIcon
					size={20}
					variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					icon={ListOrdered}
				/>
			</div>
			<EditorContent editor={editor} />
		</div>
	)
}

export default TiptapEditor
