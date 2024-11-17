import type { Context } from 'src/context.ts'

type TopicSubscription = { args: { lastProjectId: number }; context: Context }

export const matchesLastProject = ({ args, context }: TopicSubscription) => {
	return args.lastProjectId === context.extra.lastProjectId
}
