import { normalizeArticle } from '@shared/article-assets'
import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { $currentRole } from '@/state/access'
import { deferred } from '../../../tests/deferred'
import { ArticleImageButton } from './article-image-button'

const mocks = vi.hoisted(() => ({ uploadMedia: vi.fn() }))
vi.mock('@/lib/upload-file', () => mocks)
let editor: Editor
const media = {
	file: 'project_1/00000000-0000-0000-0000-000000000001',
	name: 'photo.png',
	contentType: 'image/png',
	size: 100,
	width: 1,
	height: 1
}
beforeEach(() => {
	vi.resetAllMocks()
	$currentRole.value = Role.Editor
	editor = new Editor({
		element: document.createElement('div'),
		extensions: [StarterKit, Image],
		content: '<p>Article</p>'
	})
})
afterEach(() => editor.destroy())
const open = () => {
	render(<ArticleImageButton editor={editor} />)
	fireEvent.click(screen.getByRole('button', { name: 'Add image' }))
	fireEvent.change(screen.getByLabelText('Image file'), {
		target: { files: [new File(['png'], 'photo.png', { type: 'image/png' })] }
	})
	fireEvent.change(screen.getByLabelText('Image description'), {
		target: { value: 'Photo description' }
	})
}
const submit = () => {
	const form = screen.getByLabelText('Image file').closest('form')
	if (!form) throw new Error('Missing image form')
	fireEvent.submit(form)
}

test('article images appear only after verified upload and keep a durable asset reference and description', async () => {
	const uploaded = deferred<typeof media>()
	mocks.uploadMedia.mockReturnValue(uploaded.promise)
	open()
	submit()
	expect(editor.getHTML()).not.toContain('<img')
	await act(async () => uploaded.resolve(media))
	const article = normalizeArticle(editor.getHTML())
	expect(article.assets).toEqual([media.file])
	expect(article.content).toContain('alt="Photo description"')
	expect(screen.queryByLabelText('Image file')).toBeNull()
})

test('failed uploads keep the description and cancellation discards late image results', async () => {
	mocks.uploadMedia.mockRejectedValueOnce(
		new Error('Image verification failed')
	)
	open()
	submit()
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Image verification failed'
	)
	expect(screen.getByLabelText('Image description')).toHaveProperty(
		'value',
		'Photo description'
	)
	const uploaded = deferred<typeof media>()
	mocks.uploadMedia.mockReturnValue(uploaded.promise)
	submit()
	fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
	await act(async () => uploaded.resolve(media))
	expect(editor.getHTML()).not.toContain('<img')
})
