import { signal } from '@preact/signals-react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { beforeEach, expect, test, vi } from 'vitest'
import { NodeType } from '@/gql/graphql'
import { deferred } from '../../../../tests/deferred'
import ListPreview from './list-preview'

const mocks = vi.hoisted(() => ({
	Api: { GetListPage: vi.fn(), GetListColumns: vi.fn() }
}))
vi.mock('@/gql-client', () => ({ Api: mocks.Api }))
const project = signal({ id: 1 })
const path = signal<number[]>([])
const values = signal<unknown[]>([])
const nodes = signal<unknown[]>([])
const settings = signal({})
vi.mock('@/state/project', () => ({
	get $project() {
		return project
	}
}))
vi.mock('@/state/value', () => ({
	get $activePath() {
		return path
	},
	get $values() {
		return values
	}
}))
vi.mock('@/state/tree', () => ({
	get $nodes() {
		return nodes
	},
	asNode: (id: number) => ({ id, type: 'string', name: 'Title', nodes: [] })
}))
vi.mock('@/state/node-settings', () => ({
	get $nodeSettingsMap() {
		return settings
	}
}))
vi.mock('@/components/ui/values/value-editor', () => ({
	ViewContext: { List: 'list' },
	ValueEditor: () => <span>Field value</span>
}))
vi.mock('./list-item-actions', () => ({
	ListItemActions: () => <span>Actions</span>
}))
const node = {
	id: 11,
	name: 'Entries',
	type: NodeType.List,
	revision: 1,
	order: 0,
	depth: 2,
	parent_id: 10,
	nodes: []
}
const page = {
	total: 26,
	limit: 25,
	offset: 0,
	items: [
		{
			id: 100,
			node_id: 11,
			revision: 1,
			order: 0,
			list_path: [],
			value: { name: 'First item' },
			updated_at: '2026-09-30T00:00:00Z',
			children: []
		}
	]
}
beforeEach(() => {
	vi.resetAllMocks()
	project.value = { id: 1 }
	path.value = []
	values.value = []
	nodes.value = []
	settings.value = {}
	mocks.Api.GetListColumns.mockResolvedValue([
		{ id: 12, name: 'Rank', type: 'number' }
	])
	mocks.Api.GetListPage.mockResolvedValue(page)
})
const view = () =>
	render(
		<SWRConfig
			value={{
				provider: () => new Map(),
				dedupingInterval: 0,
				errorRetryCount: 0,
				revalidateOnFocus: false
			}}
		>
			<ListPreview node={node} width={500} values={[]} />
		</SWRConfig>
	)

test('list controls submit search and typed filters, and paginate with server totals', async () => {
	view()
	await screen.findByText('First item')
	fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
	await waitFor(() =>
		expect(mocks.Api.GetListPage).toHaveBeenLastCalledWith({
			request: expect.objectContaining({ offset: 25, limit: 25 })
		})
	)
	fireEvent.change(screen.getByLabelText('Search list'), {
		target: { value: 'Find me' }
	})
	fireEvent.click(screen.getByRole('button', { name: 'Search' }))
	await waitFor(() =>
		expect(mocks.Api.GetListPage).toHaveBeenLastCalledWith({
			request: expect.objectContaining({ search: 'Find me', offset: 0 })
		})
	)
	fireEvent.change(screen.getByLabelText('Filter field'), {
		target: { value: '12' }
	})
	fireEvent.change(screen.getByLabelText('Filter operator'), {
		target: { value: 'gte' }
	})
	fireEvent.change(screen.getByLabelText('Filter value'), {
		target: { value: '10' }
	})
	fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }))
	await waitFor(() =>
		expect(mocks.Api.GetListPage).toHaveBeenLastCalledWith({
			request: expect.objectContaining({
				filters: [{ node_id: 12, operator: 'gte', value: '10' }]
			})
		})
	)
	fireEvent.change(screen.getByLabelText('Sort'), { target: { value: '12' } })
	fireEvent.change(screen.getByLabelText('Sort direction'), {
		target: { value: 'desc' }
	})
	await waitFor(() =>
		expect(mocks.Api.GetListPage).toHaveBeenLastCalledWith({
			request: expect.objectContaining({
				sort_node_id: 12,
				direction: 'desc',
				offset: 0
			})
		})
	)
})

test('failed list loads display retry and empty search results retain the controls', async () => {
	mocks.Api.GetListPage.mockRejectedValue(new Error('Disconnected'))
	view()
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Disconnected'
	)
	mocks.Api.GetListPage.mockResolvedValue({ ...page, total: 0, items: [] })
	fireEvent.click(screen.getByRole('button', { name: 'Retry list' }))
	await screen.findByText('No items yet. Add an item or import a JSON array.')
	fireEvent.change(screen.getByLabelText('Search list'), {
		target: { value: 'Nothing' }
	})
	fireEvent.click(screen.getByRole('button', { name: 'Search' }))
	await screen.findByText('No items match your search and filter.')
})

test('switching the project or nested path starts a fresh page and discards late responses', async () => {
	const old = deferred<typeof page>()
	mocks.Api.GetListPage.mockReturnValueOnce(old.promise).mockResolvedValue({
		...page,
		items: [{ ...page.items[0], value: { name: 'New project item' } }]
	})
	view()
	await waitFor(() => expect(mocks.Api.GetListPage).toHaveBeenCalled())
	act(() => {
		project.value = { id: 2 }
		path.value = [200]
	})
	await screen.findByText('New project item')
	await act(async () => old.resolve(page))
	expect(screen.queryByText('First item')).toBeNull()
	expect(mocks.Api.GetListPage).toHaveBeenLastCalledWith({
		request: expect.objectContaining({ list_path: [200], offset: 0 })
	})
})
