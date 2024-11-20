import { Api } from '@/gql-client'
import type { Project } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { rejectP } from 'ramda-adjunct'
import { $nodes, subscribeToNodes } from './tree'
import { $user, loggedIn } from './user'
import { $values, subscribeToValues } from './value'

export const $project = signal<Project>()

export const loadProject = async () =>
	loggedIn()
		? Api.GetProject()
				.then(
					evolveAlt({
						user: setSignal($user),
						project: setSignal($project),
						nodes: setSignal($nodes),
						values: setSignal($values)
					})
				)
				.then(() => {
					subscribeToValues()
					subscribeToNodes()
				})
		: rejectP('Not logged in')
