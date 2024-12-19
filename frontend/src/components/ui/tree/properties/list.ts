import { type TypeOf, object } from 'zod'

export const ListProps = object({})

export type ListProps = TypeOf<typeof ListProps>
