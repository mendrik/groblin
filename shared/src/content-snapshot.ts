import { z } from 'zod'
import { NodeType } from './node-types.ts'

const id = z.int().positive()
const revision = z.int().positive()
export const contentSnapshotSchema = z.strictObject({
	formatVersion: z.literal(1),
	project: z.strictObject({
		id,
		name: z.string().min(1),
		version: z.int().nonnegative()
	}),
	nodes: z.array(
		z.strictObject({
			id,
			project_id: id,
			revision,
			name: z.string(),
			type: z.enum(NodeType),
			order: z.int(),
			depth: z.int().positive(),
			parent_id: id.nullable()
		})
	),
	settings: z.array(
		z.strictObject({
			id,
			project_id: id,
			node_id: id,
			revision,
			settings: z.json().nullable(),
			priority: z.boolean().nullable(),
			required: z.boolean().nullable()
		})
	),
	values: z.array(
		z.strictObject({
			id,
			project_id: id,
			node_id: id,
			revision,
			value: z.json().nullable(),
			order: z.int(),
			external_id: z.string().nullable(),
			list_path: z.array(id).nullable(),
			updated_at: z.iso.datetime({ offset: true })
		})
	)
})

export type ContentSnapshot = z.infer<typeof contentSnapshotSchema>
