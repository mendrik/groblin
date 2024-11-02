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
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { failOn } from '@shared/utils/guards'
import gql from 'graphql-tag'
import { isNil, prop } from 'ramda'

/** ---- queries ---- **/
gql`
  subscription TagsUpdated {
	tagsUpdated
  }
`

gql`
  query GetTags {
    getTags {
		id
        parent_id
        name
    }
  }
`

gql`
  mutation InsertTag($data: InsertTag!) {
    insertTag(data: $data) {
		id
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

subscribe(TagsUpdatedDocument, () =>
	query(GetTagsDocument).then(prop('getTags')).then(setSignal($tags))
)

export const insertTag = (data: InsertTag): Promise<number> => {
	return query(InsertTagDocument, {
		data
	})
		.then(x => x.insertTag.id)
		.then(failOn(isNil, 'Failed to insert tag'))
}

export const deleteTag = (id: number) =>
	query(DeleteTagByIdDocument, {
		id
	})

export const updateTag = (data: ChangeTagInput): Promise<boolean> =>
	query(UpdateTagDocument, { data }).then(x => x.updateTag)
