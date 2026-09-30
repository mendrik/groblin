import type { ArticleType } from '@shared/json-value-types'
import DOMPurify from 'dompurify'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'react-use'
import TiptapEditor from '@/components/editor/tiptap-editor'
import { $canEdit } from '@/state/access'
import {
	$valueMap,
	activePath,
	saveValue,
	stageValue,
	valueDraft
} from '@/state/value'
import type { PreviewProps } from './preview-panel'

export default function ArticlePreview({ node }: PreviewProps) {
	const value = $valueMap.value[node.id]?.[0]
	const listPath = activePath(node)
	const draft = valueDraft(node.id, listPath, value?.id)
	const initial = draft?.value?.content ?? value?.value?.content
	const [article, setArticle] = useState<string>(
		typeof initial === 'string' ? initial : ''
	)
	const dirty = useRef(false)
	useEffect(() => {
		if (!draft && typeof value?.value?.content === 'string')
			setArticle(value.value.content)
	}, [draft, value?.value?.content])
	const data = (content: ArticleType) => ({
		value: content,
		node_id: node.id,
		id: draft?.id ?? value?.id,
		expectedRevision: draft?.expectedRevision ?? value?.revision ?? 0,
		list_path: listPath
	})
	const change = (content: string) => {
		if (!$canEdit.peek()) return
		dirty.current = true
		setArticle(content)
		stageValue(data({ content }))
	}
	useDebounce(
		() => {
			if ($canEdit.peek() && dirty.current && draft)
				void saveValue(data({ content: article })).catch(() => {})
		},
		500,
		[article]
	)
	return $canEdit.value ? (
		<TiptapEditor defaultValue={article} onChange={change} />
	) : (
		<article
			className="prose dark:prose-invert"
			dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article) }}
		/>
	)
}
