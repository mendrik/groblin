import type { Value } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { $valueMap, activePath, saveValue } from '@/state/value'
import type { ArticleType } from '@shared/json-value-types'
import { pipeAsync } from '@shared/utils/pipe-async'
import MDEditor from '@uiw/react-md-editor'
import { defaultTo, equals, objOf, pipe, unless } from 'ramda'
import { useState } from 'react'
import { useDebounce } from 'react-use'
import rehypeSanitize from 'rehype-sanitize'
type OwnProps = {
	node: TreeNode
}

export const ArticlePreview = ({ node }: OwnProps) => {
	const value: Value | undefined = $valueMap.value[node.id]?.[0]
	const [article, setArticle] = useState<string>(value?.value?.content ?? '')
	const listPath = activePath(node)

	const save: (value: string) => Promise<number> | string = unless(
		equals(value?.value?.content),
		pipeAsync(
			objOf('content'),
			(typeValue: ArticleType) => ({
				value: typeValue,
				node_id: node.id,
				id: value?.id,
				list_path: listPath
			}),
			saveValue
		)
	)

	useDebounce(() => save(article), 500, [article])

	return (
		<MDEditor
			className="w-full h-full self-stretch items-stretch justify-self-stretch"
			style={{
				'--color-canvas-default': 'hsl(var(--background))',
				'--md-editor-font-family': 'inherit'
			}}
			height="calc(100svh - 80px)"
			visibleDragbar={false}
			value={article}
			onChange={pipe(defaultTo(''), setArticle)}
			previewOptions={{
				rehypePlugins: [[rehypeSanitize]]
			}}
		/>
	)
}
