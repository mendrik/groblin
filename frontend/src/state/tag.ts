import { Api } from '@/gql-client'
import type {
	ChangeTagInput,
	InsertTag,
	ReorderTagInput,
	Tag
} from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { failOn } from '@shared/utils/guards'
import { find, isEmpty, isNil, pipe, prop, unless } from 'ramda'
import { $user } from './user'

export const $tags = signal<Tag[]>([])
export const $tag = signal<Tag>()

const subscribeToTags = () =>
	Api.TagsUpdated(
		{ lastProjectId: notNil($user).lastProjectId },
		{
			callback: () => Api.GetTags().then(prop('getTags')).then(setSignal($tags))
		}
	)

$tags.subscribe(unless(isEmpty, subscribeToTags))

export const insertTag = (data: InsertTag): Promise<Tag> =>
	Api.InsertTag({ data })
		.then(x => x.insertTag)
		.then(failOn(isNil, 'Failed to insert tag'))

export const deleteTag = (id: number) => Api.DeleteTagById({ id })

export const updateTag = (data: ChangeTagInput): Promise<boolean> =>
	Api.UpdateTag({ data }).then(x => x.updateTag)

export const reorderTag = (data: ReorderTagInput): Promise<Tag[]> =>
	Api.ReorderTag({ data })
		.then(x => x.reorderTag)
		.then(setSignal($tags))

export const defaultTag = (): Tag =>
	pipe(
		find<Tag>(t => t.master),
		failOn(isNil, 'No default tag')
	)($tags.value)

export const selectTag = setSignal($tag)
