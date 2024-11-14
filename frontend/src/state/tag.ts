import { GQL, subscribe } from '@/gql-client'
import {
	type ChangeTagInput,
	GetTagsDocument,
	type InsertTag,
	type ReorderTagInput,
	type Tag,
	TagsUpdatedDocument,
} from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { failOn } from '@shared/utils/guards'
import { find, isEmpty, isNil, pipe, prop, unless } from 'ramda'
import { $user } from './user'

export const $tags = signal<Tag[]>([])
export const $tag = signal<Tag>()

const tagSubscribe = () =>
	subscribe(
		TagsUpdatedDocument,
		{ lastProjectId: notNil($user).lastProjectId }
		{callback: () => query(GetTagsDocument).then(prop('getTags')).then(setSignal($tags))}
	)

$tags.subscribe(unless(isEmpty, tagSubscribe))

export const insertTag = (data: InsertTag): Promise<Tag> =>
	GQL.InsertTag({ data })
		.then(x => x.insertTag)
		.then(failOn(isNil, 'Failed to insert tag'))

export const deleteTag = (id: number) =>
	GQL.DeleteTagById({	id })

export const updateTag = (data: ChangeTagInput): Promise<boolean> =>
	GQL.UpdateTag({ data }).then(x => x.updateTag)

export const reorderTag = (data: ReorderTagInput): Promise<Tag[]> =>
	GQL.ReorderTag({ data })
		.then(x => x.reorderTag)
		.then(setSignal($tags))

export const defaultTag = (): Tag =>
	pipe(
		find<Tag>(t => t.master),
		failOn(isNil, 'No default tag')
	)($tags.value)

export const selectTag = setSignal($tag)
