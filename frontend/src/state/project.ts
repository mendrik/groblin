import { Api } from '@/gql-client'
import type { Project } from '@/gql/graphql'
import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { failOn } from '@shared/utils/guards'
import { isNil } from 'ramda'
import { rejectP } from 'ramda-adjunct'
import { $nodeSettings, subscribeToNodeSettings } from './node-settings'
import { $nodes, subscribeToNodes } from './tree'
import { $user, loggedIn } from './user'
import { $values, subscribeToValues } from './value'

export const $project = signal<Project>()

export const loadProject = async () =>
	loggedIn()
		? Api.GetProject()
				.then(failOn(isNil, 'Failed to load project'))
				.then(
					evolveAlt({
						user: setSignal($user),
						project: setSignal($project),
						nodes: setSignal($nodes),
						values: setSignal($values),
						nodeSettings: setSignal($nodeSettings)
					})
				)
				.then(() => {
					subscribeToValues()
					subscribeToNodes()
					subscribeToNodeSettings()
				})
		: rejectP('Not logged in')
