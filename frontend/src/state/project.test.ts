import { Role } from '@shared/project-roles'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { deferred } from '../../tests/deferred'
import { $currentRole, $projectChanging } from './access'

const state = vi.hoisted(() => ({
	Api: {
		GetWorkspace: vi.fn(),
		GetProject: vi.fn(),
		SwitchProject: vi.fn(),
		CreateProject: vi.fn(),
		AcceptInvitation: vi.fn(),
		DeleteProject: vi.fn()
	},
	setActiveProjectId: vi.fn(),
	configure: vi.fn(),
	stop: vi.fn(),
	subscribe: vi.fn(),
	pending: false
}))
vi.mock('@/gql-client', () => ({
	Api: state.Api,
	setActiveProjectId: state.setActiveProjectId,
	Subscribe: { WorkspaceUpdated: () => ({ abort: state.stop }) }
}))
vi.mock('./save-status', () => ({
	hasPendingEdits: { peek: () => state.pending }
}))
vi.mock('./tree', async () => {
	const { signal } = await import('@preact/signals-react')
	return {
		$nodes: signal([]),
		$focusedNode: signal(),
		$editingNode: signal(),
		$nodeStates: signal({}),
		nodeSaves: { configure: state.configure },
		stopNodesSubscription: state.stop,
		subscribeToNodes: state.subscribe
	}
})
vi.mock('./value', async () => {
	const { signal } = await import('@preact/signals-react')
	return {
		$values: signal([]),
		$activeListItems: signal({}),
		valueSaves: { configure: state.configure },
		stopValuesSubscription: state.stop,
		subscribeToValues: state.subscribe
	}
})
vi.mock('./node-settings', async () => {
	const { signal } = await import('@preact/signals-react')
	return {
		$nodeSettings: signal([]),
		settingsSaves: { configure: state.configure },
		stopSettingsSubscription: state.stop,
		subscribeToNodeSettings: state.subscribe
	}
})

import {
	$project,
	$projects,
	createProject,
	loadProject,
	refreshWorkspace,
	switchProject
} from './project'
import { $focusedNode } from './tree'
import { $user } from './user'

beforeEach(() => {
	vi.resetAllMocks()
	state.pending = false
	$projectChanging.value = false
	$user.value = {
		id: 'user',
		name: 'User',
		email: 'user@example.invalid',
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
	state.Api.GetWorkspace.mockResolvedValue({
		projects: [{ id: 1, name: 'One', version: 1, role: Role.Owner }],
		currentProject: { id: 1, role: Role.Owner }
	})
	state.Api.GetProject.mockResolvedValue({
		project: { id: 1, name: 'One', version: 1 },
		nodes: [],
		values: [],
		nodeSettings: []
	})
})
afterEach(() => {
	$user.value = undefined
	$currentRole.value = undefined
})

test('loads the selected project and scopes every recovery queue to the account and project', async () => {
	$focusedNode.value = 99
	await loadProject('user')
	expect($project.value?.id).toBe(1)
	expect($currentRole.value).toBe(Role.Owner)
	expect($focusedNode.value).toBeUndefined()
	expect(state.setActiveProjectId).toHaveBeenCalledWith(1)
	expect(state.configure.mock.calls).toEqual([
		[1, 'user'],
		[1, 'user', 'nodes'],
		[1, 'user', 'settings']
	])
})

test('an empty workspace is usable without attempting an unauthorized project query', async () => {
	state.Api.GetWorkspace.mockResolvedValue({
		projects: [],
		currentProject: null
	})
	await loadProject('user')
	expect($projects.value).toEqual([])
	expect($project.value).toBeUndefined()
	expect(state.Api.GetProject).not.toHaveBeenCalled()
})

test('pending edits prevent project switching or creation before any mutation', async () => {
	state.pending = true
	await expect(switchProject(2)).rejects.toThrow('pending edits')
	await expect(createProject('New')).rejects.toThrow('pending edits')
	expect(state.Api.SwitchProject).not.toHaveBeenCalled()
	expect(state.Api.CreateProject).not.toHaveBeenCalled()
})

test('switching waits for acknowledgement, blocks edits during the change and reloads the server selection', async () => {
	const response = deferred<boolean>()
	state.Api.SwitchProject.mockReturnValue(response.promise)
	const changing = switchProject(2)
	expect($projectChanging.value).toBe(true)
	expect(state.Api.GetProject).not.toHaveBeenCalled()
	await expect(switchProject(3)).rejects.toThrow('current project change')
	response.resolve(true)
	await changing
	expect(state.setActiveProjectId).toHaveBeenCalledWith(undefined)
	expect(state.Api.GetProject).toHaveBeenCalledOnce()
	expect($projectChanging.value).toBe(false)
})

test('lost acknowledgements reconcile with the server, and live role refresh removes edit privileges after revocation', async () => {
	state.Api.SwitchProject.mockRejectedValue(new Error('Disconnected'))
	await expect(switchProject(2)).rejects.toThrow('Disconnected')
	expect(state.Api.GetWorkspace).toHaveBeenCalledOnce()
	state.Api.GetWorkspace.mockResolvedValue({
		projects: [{ id: 1, role: Role.Viewer }],
		currentProject: { id: 1 }
	})
	await refreshWorkspace()
	expect($currentRole.value).toBe(Role.Viewer)
	state.Api.GetWorkspace.mockResolvedValue({
		projects: [],
		currentProject: null
	})
	await refreshWorkspace()
	expect($currentRole.value).toBeUndefined()
})
