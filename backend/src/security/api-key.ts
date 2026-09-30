import { createHash } from 'node:crypto'

export const hashApiKey = (key: string): string =>
	`sha256:${createHash('sha256').update(key).digest('hex')}`
