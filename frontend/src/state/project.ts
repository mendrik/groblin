import { query } from '@/gql-client'
import { GetProjectDocument, type Project } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import gql from 'graphql-tag'
import { find, pipe, prop, propEq } from 'ramda'
import { rejectP } from 'ramda-adjunct'
import { $tag, $tags } from './tag'
import { $nodes } from './tree'
import { $user, loggedIn } from './user'

export const $project = signal<Project>()

gql`
  query GetProject {
    getProject {
		user {
			id
			email
			name	
			lastProjectId
		}
		project {
			name
		}
		nodes {
            ...Node
        }
		tags {
			id
			name
			master
			parent_id	
		}
    }
  }
`

export const loadProject = async () =>
	loggedIn()
		? query(GetProjectDocument)
				.then(prop('getProject'))
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
