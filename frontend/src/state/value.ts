import { Api, Subscribe } from '@/gql-client'
import type { Tag, Value } from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { isNotNil, when } from 'ramda'
import { $tag } from './tag'
import { $user } from './user'

export const $values = signal<Value[]>([])

const subscribeToTags = (tag: Tag) =>
	Subscribe.ValuesUpdated({ lastProjectId: notNil($user).lastProjectId }, () =>
		Api.GetValues({ tagId: tag.id }).then(setSignal($values))
	)

$tag.subscribe(when(isNotNil, subscribeToTags))
