import type { Context } from 'src/context.ts'

type TopicSubscription = { args: { projectId: number }; context: Context }

export const matchesLastProject = ({ args, context }: TopicSubscription) => {
	console.log('matchesLastProject', args, context)

	return args.projectId === context.user.lastProjectId
}
