import type { Context } from 'src/context.ts'

type TopicSubscription = { args: { projectId: number }; context: Context }

export const matchesLastProject = ({ args, context }: TopicSubscription) => {
	return args.projectId === context.user.lastProjectId
}
