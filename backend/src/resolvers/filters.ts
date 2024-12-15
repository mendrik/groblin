import type { Context } from 'src/types.ts'

type TopicSubscription = { args: { projectId: number }; context: Context }

export const matchesLastProject = ({ args, context }: TopicSubscription) =>
	args.projectId === context.user.lastProjectId
