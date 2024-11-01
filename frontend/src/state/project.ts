import { query } from '@/gql-client'
import { GetProjectDocument } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { evolveAlt } from '@shared/utils/evolve-alt'
import gql from 'graphql-tag'
import { isNotNil, prop, when } from 'ramda'
import { $tags } from './tag'
import { $nodes } from './tree'
import { $user } from './user'

gql`
  query GetProject {
    getProject {
		nodes {
            ...Node
        }
		tags {
			id
			name
			parent_id	
		}
    }
  }
`

const loadProject = () =>
	query(GetProjectDocument)
		.then(prop('getProject'))
		.then(
			evolveAlt({
				nodes: setSignal($nodes),
				tags: setSignal($tags)
			})
		)

$user.subscribe(when(isNotNil, loadProject))
