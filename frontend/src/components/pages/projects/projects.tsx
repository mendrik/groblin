import { projectNameSchema } from '@shared/project-roles'
import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Api } from '@/gql-client'
import { $canManage, $isOwner } from '@/state/access'
import {
	$project,
	$projects,
	$workspaceError,
	createProject,
	deleteProject,
	loadProject,
	requireSettledEdits,
	switchProject
} from '@/state/project'
import { hasPendingEdits } from '@/state/save-status'
import { Page } from '../page'
import { ProjectArchive } from './project-archive'

export function Projects() {
	const [, navigate] = useLocation()
	const [name, setName] = useState('')
	const [rename, setRename] = useState('')
	const [deleting, setDeleting] = useState<{
		name: string
		version: number
		fields: number
		values: number
	}>()
	const [confirmation, setConfirmation] = useState('')
	const [error, setError] = useState<string>()
	const [busy, setBusy] = useState(false)
	const run = async (action: () => Promise<unknown>) => {
		setBusy(true)
		setError(undefined)
		try {
			await action()
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Project action failed.'
			)
		} finally {
			setBusy(false)
		}
	}
	return (
		<Page>
			<h1>Projects</h1>
			{(error || $workspaceError.value) && (
				<p role="alert">{error ?? $workspaceError.value}</p>
			)}
			{hasPendingEdits.value && (
				<p>
					Save or resolve pending edits before creating, switching or deleting a
					project.
				</p>
			)}
			<ul className="space-y-2">
				{$projects.value.map(project => (
					<li key={project.id} className="flex gap-3 items-center">
						<span className="flex-1">
							{project.name} · {project.role}
						</span>
						<Button
							variant="secondary"
							disabled={
								busy ||
								hasPendingEdits.value ||
								project.id === $project.value?.id
							}
							onClick={() =>
								void run(async () => {
									await switchProject(project.id)
									navigate('/')
								})
							}
						>
							{project.id === $project.value?.id ? 'Current project' : 'Open'}
						</Button>
					</li>
				))}
			</ul>
			{!$projects.value.length && (
				<p>
					Create your first project, or open an invitation link to join one.
				</p>
			)}
			<form
				className="flex gap-2 mt-4"
				onSubmit={event => {
					event.preventDefault()
					void run(async () => {
						await createProject(projectNameSchema.parse(name))
						setName('')
						navigate('/')
					})
				}}
			>
				<Input
					aria-label="New project name"
					placeholder="Project name"
					value={name}
					onChange={event => setName(event.target.value)}
					maxLength={160}
					required
				/>
				<Button type="submit" disabled={busy || hasPendingEdits.value}>
					Create project
				</Button>
			</form>
			{$canManage.value && $project.value && (
				<>
					<h2>Current project</h2>
					<form
						className="flex gap-2"
						onSubmit={event => {
							event.preventDefault()
							void run(async () => {
								requireSettledEdits()
								const current = await Api.GetProject()
								await Api.RenameProject({
									name: projectNameSchema.parse(rename),
									expectedVersion: current.project.version
								})
								await loadProject()
								setRename('')
							})
						}}
					>
						<Input
							aria-label="Rename project"
							placeholder={$project.value.name}
							value={rename}
							onChange={event => setRename(event.target.value)}
							required
							maxLength={160}
						/>
						<Button type="submit" disabled={busy || hasPendingEdits.value}>
							Rename
						</Button>
					</form>
				</>
			)}
			<ProjectArchive />
			{$isOwner.value && $project.value && (
				<div className="border rounded p-4 mt-6 space-y-3">
					<h2>Delete project</h2>
					<p>
						Deletion removes the project, members, API keys, history and all
						uploaded files. Export a copy before deleting.
					</p>
					{deleting ? (
						<>
							<p>
								Delete {deleting.name}, including {deleting.fields} fields and{' '}
								{deleting.values} root values? All nested list values and
								history are also removed.
							</p>
							<label htmlFor="delete-project">
								Type {deleting.name} to confirm
							</label>
							<Input
								id="delete-project"
								value={confirmation}
								onChange={event => setConfirmation(event.target.value)}
							/>
							<Button
								variant="destructive"
								disabled={
									busy ||
									hasPendingEdits.value ||
									confirmation !== deleting.name
								}
								onClick={() =>
									void run(async () => {
										await deleteProject(deleting.version, confirmation)
										setDeleting(undefined)
										setConfirmation('')
									})
								}
							>
								Confirm deletion
							</Button>
							<Button
								variant="secondary"
								disabled={busy}
								onClick={() => setDeleting(undefined)}
							>
								Cancel
							</Button>
						</>
					) : (
						<Button
							variant="destructive"
							disabled={busy || hasPendingEdits.value}
							onClick={() =>
								void run(async () => {
									const current = await Api.GetProject()
									setDeleting({
										name: current.project.name,
										version: current.project.version,
										fields: current.nodes.length,
										values: current.values.length
									})
									setConfirmation('')
								})
							}
						>
							Review deletion
						</Button>
					)}
				</div>
			)}
		</Page>
	)
}
