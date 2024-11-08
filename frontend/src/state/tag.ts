import { query, subscribe } from '@/gql-client'
import {
	type ChangeTagInput,
	DeleteTagByIdDocument,
	GetTagsDocument,
	type InsertTag,
	InsertTagDocument,
	type Tag,
	TagsUpdatedDocument,
	UpdateTagDocument
} from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { failOn } from '@shared/utils/guards'
import gql from 'graphql-tag'
import { isEmpty, isNil, prop, unless } from 'ramda'
import { $user } from './user'

/** ---- queries ---- **/
gql`
  subscription TagsUpdated($lastProjectId: Int!) {
	tagsUpdated(lastProjectId: $lastProjectId)
  }
`

gql`
  query GetTags {
    getTags {
		id
        parent_id
        name
		master
    }
  }
`

gql`
  mutation InsertTag($data: InsertTag!) {
    insertTag(data: $data) {
		id
		name
		parent_id
		master
	}
  }
`

gql`
  mutation UpdateTag($data: ChangeTagInput!) {
    updateTag(data: $data)
  }
`

gql`
  mutation DeleteTagById($id: Int!) {
    deleteTagById(id: $id)
  }
`

export const $tags = signal<Tag[]>([])
export const $tag = signal<Tag>()

const tagSubscribe = () =>
	subscribe(
		TagsUpdatedDocument,
		() => query(GetTagsDocument).then(prop('getTags')).then(setSignal($tags)),
		{ lastProjectId: notNil($user).lastProjectId }
	)

$tags.subscribe(unless(isEmpty, tagSubscribe))

export const insertTag = (data: InsertTag): Promise<Tag> =>
	query(InsertTagDocument, {
		data
	})
		.then(prop('insertTag'))
		.then(failOn(isNil, 'Failed to insert tag'))

export const deleteTag = (id: number) =>
	query(DeleteTagByIdDocument, {
		id
	})

export const updateTag = (data: ChangeTagInput): Promise<boolean> =>
	query(UpdateTagDocument, { data }).then(x => x.updateTag)

export const selectTag = setSignal($tag)
