import type { Context } from 'src/context.ts'
import type { Tag } from './tag-resolver.ts'

type TopicSubscription = { args: { lastProjectId: number }; context: Context }

export const matchesLastProject = ({ args, context }: TopicSubscription) => {
	return args.lastProjectId === context.extra.lastProjectId
}

export const masterTag = (tag: Tag) => tag.master
