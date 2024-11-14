import { Api } from '@/gql-client'
import type { Project } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { find, pipe, prop, propEq } from 'ramda'
import { rejectP } from 'ramda-adjunct'
import { $tag, $tags } from './tag'
import { $nodes } from './tree'
import { $user, loggedIn } from './user'

export const $project = signal<Project>()

export const loadProject = async () =>
	loggedIn()
		? Api.GetProject()
				.then(x => x.getProject)
				.then(
					evolveAlt({
						user: setSignal($user),
						project: setSignal($project),
						nodes: setSignal($nodes),
						tags: setSignal($tags),
						tag: pipe(
							prop('tags'),
							find(propEq(true, 'master')),
							setSignal($tag)
						)
					})
				)
		: rejectP('Not logged in')
