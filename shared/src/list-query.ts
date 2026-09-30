import { z } from 'zod'

export const listFilterSchema = z.strictObject({
	node_id: z.int().positive(),
	operator: z.enum([
		'equals',
		'contains',
		'gt',
		'gte',
		'lt',
		'lte',
		'exists',
		'missing'
	]),
	value: z.string().max(500).nullish()
})
export const listRequestSchema = z.strictObject({
	node_id: z.int().positive(),
	list_path: z.array(z.int().positive()).max(64).nullish(),
	search: z.string().trim().max(200).nullish(),
	filters: z.array(listFilterSchema).max(8).nullish(),
	sort_node_id: z.int().positive().nullish(),
	direction: z.enum(['asc', 'desc']).nullish(),
	limit: z.int().min(1).max(100).nullish(),
	offset: z.int().min(0).max(1000000).nullish()
})
export type ListQuery = z.infer<typeof listRequestSchema>
