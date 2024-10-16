import type { ZodFormField } from '../tree/types'

export const asField = (meta: ZodFormField): string => JSON.stringify(meta)
