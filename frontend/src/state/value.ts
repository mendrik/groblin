import { Api, Subscribe } from '@/gql-client'
import type { InsertListItem, SelectedListItem, Value } from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import {} from 'ramda'
import { $project } from './project'

export const $values = signal<Value[]>([])

export const $selectedListItems = signal<SelectedListItem[]>([])

export const subscribeToValues = () =>
	Subscribe.ValuesUpdated({ projectId: notNil($project).id }, () =>
		Api.GetValues({ listItems: notNil($selectedListItems) }).then(
			setSignal($values)
		)
	)

export const insertListItem = (listItem: InsertListItem) =>
	Api.InsertListItem({ listItem })

export const focusListItem = (params: any) => {}

export const deleteListItem = (params: any) => {}
