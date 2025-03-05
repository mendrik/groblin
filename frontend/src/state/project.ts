import { Api } from '@/gql-client'
import type { Project } from '@/gql/graphql'
import { getSession } from '@/lib/auth-client'
import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { failOn } from '@shared/utils/guards'
import { isNil } from 'ramda'
import { $nodeSettings, subscribeToNodeSettings } from './node-settings'
import { $nodes, subscribeToNodes } from './tree'
import { $user } from './user'
import { $values, subscribeToValues } from './value'

export const $project = signal<Project>()

export const loadProject = async () =>
	getSession().then(() =>
		Api.GetProject()
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
	)
