import { type TypeOf, object } from 'zod/v4'

export const ListProps = object({})

export type ListProps = TypeOf<typeof ListProps>
