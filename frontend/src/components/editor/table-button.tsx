import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { BetweenHorizonalStart, ListX, Table, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MicroIcon } from '../ui/random/micro-icon'

type OwnProps = {
	editor: Editor
}

export const TableButton = ({ editor }: OwnProps) => (
	<>
		<BubbleMenu
			editor={editor}
			options={{ placement: 'top' }}
			shouldShow={({ editor }) =>
				editor.isActive('table') ||
				editor.isActive('tableCell') ||
				editor.isActive('tableHeader') ||
				editor.isActive('tableRow')
			}
			className={cn(
				'z-50 rounded-md border border-muted-foreground bg-popover p-1 text-popover-foreground shadow-md',
				'outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95',
				'data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
				'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
				'flex gap-1'
			)}
		>
			<MicroIcon
				onClick={() => editor.chain().focus().addRowBefore().run()}
				icon={BetweenHorizonalStart}
			/>
			<MicroIcon
				onClick={() => editor.chain().focus().addRowAfter().run()}
				icon={BetweenHorizonalStart}
			/>
			<MicroIcon
				onClick={() => editor.chain().focus().deleteRow().run()}
				icon={ListX}
			/>
			<MicroIcon
				onClick={() => editor.chain().focus().addColumnBefore().run()}
				icon={BetweenHorizonalStart}
			/>
			<MicroIcon
				onClick={() => editor.chain().focus().addColumnAfter().run()}
				icon={BetweenHorizonalStart}
			/>
			<MicroIcon
				onClick={() => editor.chain().focus().deleteColumn().run()}
				icon={Trash}
			/>
		</BubbleMenu>
		<MicroIcon
			size={20}
			variant="ghost"
			icon={Table}
			onClick={() => {
				if (!editor.isActive('table')) {
					editor
						.chain()
						.focus()
						.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
						.run()
				}
			}}
		/>
	</>
)
