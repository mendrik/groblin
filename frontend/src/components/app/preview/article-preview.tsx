import type { TreeNode } from '@/state/tree'
import MDEditor from '@uiw/react-md-editor'
import { defaultTo, pipe } from 'ramda'
import { useState } from 'react'
import rehypeSanitize from 'rehype-sanitize'
import './article-preview.css'
type OwnProps = {
	node: TreeNode
	width: number
}

export const ArticlePreview = ({ node: currentNode, width }: OwnProps) => {
	const [value, setValue] = useState<string>('')
	return (
		<MDEditor
			className="w-full h-full self-stretch items-stretch justify-self-stretch"
			style={{
				'--color-canvas-default': 'hsl(var(--background))',
				'--md-editor-font-family': 'inherit'
			}}
			height="calc(100svh - 80px)"
			visibleDragbar={false}
			value={value}
			onChange={pipe(defaultTo(''), setValue)}
			previewOptions={{
				rehypePlugins: [[rehypeSanitize]]
			}}
		/>
	)
}
