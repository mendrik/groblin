import { listSettingsSchema } from '@shared/node-settings'
import type { infer as TypeOf } from 'zod/v4'

export const ListProps = listSettingsSchema.safeExtend({})

export type ListProps = TypeOf<typeof ListProps>
