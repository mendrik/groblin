import { query } from '@/gql-client'
import { GetProjectDocument } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { evolveAlt } from '@shared/utils/evolve-alt'
import gql from 'graphql-tag'
import { head, isNotNil, pipe, prop, when } from 'ramda'
import { $tag, $tags } from './tag'
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
				tags: setSignal($tags),
				tag: pipe(prop('tags'), head, setSignal($tag))
			})
		)

$user.subscribe(when(isNotNil, loadProject))
