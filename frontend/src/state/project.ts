import { batch, signal } from '@preact/signals-react'
import { roleSchema } from '@shared/project-roles'
import type { Project, ProjectMembership } from '@/gql/graphql'
import { Api, Subscribe, setActiveProjectId } from '@/gql-client'
import { $currentRole, $projectChanging } from './access'
import {
	$nodeSettings,
	settingsSaves,
	stopSettingsSubscription,
	subscribeToNodeSettings
} from './node-settings'
import { hasPendingEdits } from './save-status'
import {
	$editingNode,
	$focusedNode,
	$nodeStates,
	$nodes,
	nodeSaves,
	stopNodesSubscription,
	subscribeToNodes
} from './tree'
import { $user } from './user'
import {
	$activeListItems,
	$values,
	stopValuesSubscription,
	subscribeToValues,
	valueSaves
} from './value'

export const $project = signal<Project>()
export const $projects = signal<ProjectMembership[]>([])
export const $workspaceError = signal<string>()
let workspaceSubscription: AbortController | undefined
let loadGeneration = 0

export const requireSettledEdits = () => {
	if (hasPendingEdits.peek())
		throw new Error(
			'Save or resolve your pending edits before changing projects.'
		)
}

export const refreshWorkspace = async () => {
	const workspace = await Api.GetWorkspace()
	$projects.value = workspace.projects
	const active = workspace.projects.find(
		project => project.id === $project.peek()?.id
	)
	$currentRole.value = active ? roleSchema.parse(active.role) : undefined
	if ($project.peek() && !active)
		$workspaceError.value =
			'Your membership in this project ended. Your local edits are retained. Choose another project.'
	return workspace
}

export const stopProjectSubscriptions = () => {
	workspaceSubscription?.abort()
	stopValuesSubscription()
	stopNodesSubscription()
	stopSettingsSubscription()
}

export const loadProject = async (userId?: string) => {
	const generation = ++loadGeneration
	const workspace = await Api.GetWorkspace()
	if (generation !== loadGeneration) return
	setActiveProjectId(workspace.currentProject?.id)
	const data = workspace.currentProject ? await Api.GetProject() : undefined
	if (generation !== loadGeneration) return
	stopProjectSubscriptions()
	batch(() => {
		$projects.value = workspace.projects
		$currentRole.value = workspace.currentProject
			? roleSchema.parse(workspace.currentProject.role)
			: undefined
		$project.value = data?.project
		$focusedNode.value = undefined
		$editingNode.value = undefined
		$activeListItems.value = {}
		$nodeStates.value = {}
		$nodes.value = data?.nodes ?? []
		$values.value = data?.values ?? []
		$nodeSettings.value = data?.nodeSettings ?? []
		$workspaceError.value = undefined
	})
	const editorId = userId ?? $user.peek()?.id
	if (editorId && data) {
		valueSaves.configure(data.project.id, editorId)
		nodeSaves.configure(data.project.id, editorId, 'nodes')
		settingsSaves.configure(data.project.id, editorId, 'settings')
	}
	if (data) {
		subscribeToValues()
		subscribeToNodes()
		subscribeToNodeSettings()
		workspaceSubscription = Subscribe.WorkspaceUpdated({}, () => {
			void refreshWorkspace().catch(() => {})
		})
	}
}

const changeProject = async (change: () => Promise<unknown>) => {
	requireSettledEdits()
	if ($projectChanging.peek())
		throw new Error('Wait for the current project change.')
	$projectChanging.value = true
	stopProjectSubscriptions()
	try {
		await change()
		setActiveProjectId(undefined)
		await loadProject()
	} catch (error) {
		// Reconnect to the actual server selection even if the acknowledgement was lost.
		setActiveProjectId(undefined)
		await loadProject().catch(() => {})
		throw error
	} finally {
		$projectChanging.value = false
	}
}
export const switchProject = (id: number) =>
	changeProject(() => Api.SwitchProject({ id }))
export const createProject = (name: string) =>
	changeProject(() => Api.CreateProject({ name }))
export const deleteProject = (expectedVersion: number, confirmation: string) =>
	changeProject(() => Api.DeleteProject({ expectedVersion, confirmation }))
export const acceptInvitation = (token: string) =>
	changeProject(() => Api.AcceptInvitation({ token }))

if (typeof window !== 'undefined')
	window.addEventListener('focus', () => {
		if ($user.peek()) void refreshWorkspace().catch(() => {})
	})
