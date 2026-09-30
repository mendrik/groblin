import { useSignalEffect } from '@preact/signals-react'
import { listValueSchema } from '@shared/content'
import { append, propEq } from 'ramda'
import { compact } from 'ramda-adjunct'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ValueEditor, ViewContext } from '@/components/ui/values/value-editor'
import FocusTravel from '@/components/utils/focus-travel'
import type { ListRequest, Node } from '@/gql/graphql'
import { Api } from '@/gql-client'
import { cn } from '@/lib/utils'
import { $nodeSettingsMap } from '@/state/node-settings'
import { $project } from '@/state/project'
import { $nodes, asNode } from '@/state/tree'
import { $activePath, $values } from '@/state/value'
import { ListItemActions } from './list-item-actions'
import './list-preview.css'
import type { PreviewProps } from './preview-panel'

const selectClass =
	'h-9 rounded-md border border-input bg-background px-2 text-sm'
const textTypes = ['string', 'article', 'choice', 'media']
function ListContents({
	node,
	width,
	projectId,
	path
}: {
	node: Node
	width: number
	projectId: number | undefined
	path: number[]
}) {
	const { mutate } = useSWRConfig()
	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [limit, setLimit] = useState(25)
	const [offset, setOffset] = useState(0)
	const [sort, setSort] = useState(0)
	const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
	const [filterNode, setFilterNode] = useState(0)
	const [operator, setOperator] = useState('equals')
	const [filterValue, setFilterValue] = useState('')
	const [filter, setFilter] = useState<ListRequest['filters']>()
	const request: ListRequest = {
		node_id: node.id,
		list_path: path,
		search,
		limit,
		offset,
		sort_node_id: sort || undefined,
		direction,
		filters: filter
	}
	const key = ['list-page', projectId, request] as const
	const columnsKey = ['list-columns', projectId, node.id] as const
	const page = useSWR(key, () => Api.GetListPage({ request }))
	const model = useSWR(columnsKey, () =>
		Api.GetListColumns({ node_id: node.id })
	)
	const allColumns = model.data ?? []
	const columns = allColumns.slice(
		0,
		Math.max(1, Math.min(8, Math.floor(width / 140)))
	)
	const selectedFilter = allColumns.find(column => column.id === filterNode)
	const operators =
		selectedFilter?.type === 'boolean'
			? ['equals', 'exists', 'missing']
			: textTypes.includes(selectedFilter?.type ?? 'string')
				? ['equals', 'contains', 'exists', 'missing']
				: ['equals', 'gt', 'gte', 'lt', 'lte', 'exists', 'missing']
	useSignalEffect(() => {
		const _ = [$values.value, $nodes.value, $nodeSettingsMap.value]
		void mutate(key)
		void mutate(columnsKey)
	})
	const rows = page.data?.items ?? []
	const total = page.data?.total ?? 0
	const empty = !page.isLoading && !page.error && !rows.length
	return (
		<FocusTravel autoFocus={false}>
			<div className="space-y-3 py-3">
				<form
					className="flex gap-2"
					onSubmit={event => {
						event.preventDefault()
						setSearch(searchInput.trim())
						setOffset(0)
					}}
				>
					<Input
						aria-label="Search list"
						type="search"
						placeholder="Search items and fields"
						value={searchInput}
						maxLength={200}
						onChange={event => setSearchInput(event.target.value)}
					/>
					<Button type="submit" variant="secondary">
						Search
					</Button>
				</form>
				<form
					className="flex flex-wrap gap-2"
					onSubmit={event => {
						event.preventDefault()
						setOffset(0)
						setFilter(
							filterNode
								? [{ node_id: filterNode, operator, value: filterValue }]
								: undefined
						)
					}}
				>
					<select
						aria-label="Filter field"
						className={selectClass}
						value={filterNode}
						onChange={event => {
							setFilterNode(Number(event.target.value))
							setOperator('equals')
						}}
					>
						<option value={0}>Choose filter field</option>
						<option value={node.id}>Item name</option>
						{allColumns
							.filter(column => column.type !== 'color')
							.map(column => (
								<option key={column.id} value={column.id}>
									{column.name}
								</option>
							))}
					</select>
					<select
						aria-label="Filter operator"
						className={selectClass}
						value={operator}
						onChange={event => setOperator(event.target.value)}
					>
						{operators.map(operator => (
							<option key={operator} value={operator}>
								{operator}
							</option>
						))}
					</select>
					{!['exists', 'missing'].includes(operator) && (
						<Input
							className="w-36"
							aria-label="Filter value"
							value={filterValue}
							maxLength={500}
							onChange={event => setFilterValue(event.target.value)}
							placeholder={
								selectedFilter?.type === 'boolean' ? 'true or false' : 'Value'
							}
						/>
					)}
					<Button type="submit" variant="secondary" disabled={!filterNode}>
						Apply filter
					</Button>
					{filter?.length && (
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setFilter(undefined)
								setOffset(0)
							}}
						>
							Clear filter
						</Button>
					)}
				</form>
				<div className="flex flex-wrap items-center gap-2">
					<label htmlFor="list-sort">Sort</label>
					<select
						id="list-sort"
						className={selectClass}
						value={sort}
						onChange={event => {
							setSort(Number(event.target.value))
							setOffset(0)
						}}
					>
						<option value={0}>Saved order</option>
						<option value={node.id}>Item name</option>
						{allColumns.map(column => (
							<option key={column.id} value={column.id}>
								{column.name}
							</option>
						))}
					</select>
					<select
						aria-label="Sort direction"
						className={selectClass}
						value={direction}
						onChange={event => {
							setDirection(event.target.value === 'desc' ? 'desc' : 'asc')
							setOffset(0)
						}}
					>
						<option value="asc">Ascending</option>
						<option value="desc">Descending</option>
					</select>
					<label htmlFor="list-page-size">Per page</label>
					<select
						id="list-page-size"
						className={selectClass}
						value={limit}
						onChange={event => {
							setLimit(Number(event.target.value))
							setOffset(0)
						}}
					>
						{[25, 50, 100].map(size => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
				</div>
				{page.isLoading && <p role="status">Loading items…</p>}
				{(page.error || model.error) && (
					<div role="alert">
						<p>
							{page.error instanceof Error
								? page.error.message
								: model.error instanceof Error
									? model.error.message
									: 'Could not load this list.'}
						</p>
						<Button
							variant="secondary"
							onClick={() => {
								void page.mutate()
								void model.mutate()
							}}
						>
							Retry list
						</Button>
					</div>
				)}
				{empty && (
					<p>
						{search || filter?.length
							? 'No items match your search and filter.'
							: offset
								? 'This page is empty. Go to the previous page.'
								: 'No items yet. Add an item or import a JSON array.'}
					</p>
				)}
			</div>
			{!!rows.length && (
				<ol
					className="w-full table grid-lines mr-2"
					style={{ '--columns': columns.length + 1 }}
				>
					<li className="item sticky top-0 h-auto">
						<div />
						<div className="label">Item</div>
						{columns.map(({ id, type, name }) => (
							<div key={id} className={cn('label', type)}>
								{name}
							</div>
						))}
					</li>
					{rows.map(item => (
						<li key={item.id} className="item">
							<div className="options">
								<ListItemActions
									node={asNode(node.id)}
									id={item.id}
									value={{ ...item, value: listValueSchema.parse(item.value) }}
								/>
							</div>
							<div className="key-value">
								{listValueSchema.parse(item.value).name || `Item ${item.id}`}
							</div>
							{columns.map(column => {
								const value = item.children.find(propEq(column.id, 'node_id'))
								return (
									<div
										key={value?.id ?? column.id}
										className={cn('key-value', column.type)}
									>
										<ValueEditor
											node={asNode(column.id)}
											value={compact([value])}
											view={ViewContext.List}
											listPath={append(item.id, item.list_path ?? [])}
										/>
									</div>
								)
							})}
						</li>
					))}
				</ol>
			)}
			<div className="flex items-center gap-3 py-3">
				<p aria-live="polite">
					{total
						? `${Math.min(offset + 1, total)}–${Math.min(offset + rows.length, total)} of ${total} items`
						: '0 items'}
					{page.isValidating && !page.isLoading ? ' · Updating…' : ''}
				</p>
				<Button
					variant="secondary"
					disabled={!offset || page.isLoading}
					onClick={() => setOffset(Math.max(0, offset - limit))}
				>
					Previous page
				</Button>
				<Button
					variant="secondary"
					disabled={offset + limit >= total || page.isLoading}
					onClick={() => setOffset(offset + limit)}
				>
					Next page
				</Button>
			</div>
		</FocusTravel>
	)
}

export default function ListPreview({ node, width }: PreviewProps) {
	const path = $activePath.value ?? []
	const projectId = $project.value?.id
	return (
		<ListContents
			key={`${projectId}:${node.id}:${path.join(',')}`}
			node={node}
			width={width}
			projectId={projectId}
			path={path}
		/>
	)
}
