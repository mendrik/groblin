import { Api } from '@/gql-client'
import type { Project } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import {} from 'ramda'
import { rejectP } from 'ramda-adjunct'
import { $nodes } from './tree'
import { $user, loggedIn } from './user'
import { $values } from './value'

export const $project = signal<Project>()

export const loadProject = async () =>
	loggedIn()
		? Api.GetProject().then(
				evolveAlt({
					user: setSignal($user),
					project: setSignal($project),
					nodes: setSignal($nodes),
					values: setSignal($values)
				})
			)
		: rejectP('Not logged in')
