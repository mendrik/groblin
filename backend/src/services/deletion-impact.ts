import { createHash } from 'node:crypto'
import { GraphQLError } from 'graphql'
import type { Kysely } from 'kysely'
import type { DB } from '../database/schema.ts'
import {
	type DeletionImpact,
	DeletionKind,
	type DeletionTarget
} from '../gql/schema.ts'
import { NodeType } from '../types.ts'
import { isJsonObject } from '../utils/json.ts'
import { parseNode } from '../utils/parse-node.ts'

/** Recompute this snapshot under the project write lock before deleting. */
export async function deletionSnapshot(
	db: Kysely<DB>,
	projectId: number,
	target: DeletionTarget
) {
	const nodes = (
		await db
			.selectFrom('node')
			.selectAll()
			.where('project_id', '=', projectId)
			.orderBy('id')
			.execute()
	).map(parseNode)
	const values = await db
		.selectFrom('values')
		.selectAll()
		.where('project_id', '=', projectId)
		.orderBy('id')
		.execute()
	const value =
		target.kind === DeletionKind.Value
			? values.find(row => row.id === target.id)
			: undefined
	const node = nodes.find(
		row =>
			row.id ===
			(target.kind === DeletionKind.Value ? value?.node_id : target.id)
	)
	if (!node)
		throw new GraphQLError('Content no longer exists', {
			extensions: { code: 'BAD_USER_INPUT' }
		})
	if (target.kind === DeletionKind.Node && node.type === NodeType.root)
		throw new GraphQLError('Cannot delete project root', {
			extensions: { code: 'BAD_USER_INPUT' }
		})
	const affectedNodeIds = new Set([node.id])
	if (target.kind !== DeletionKind.Value) {
		let changed = true
		while (changed) {
			changed = false
			for (const candidate of nodes)
				if (
					candidate.parent_id != null &&
					affectedNodeIds.has(candidate.parent_id) &&
					!affectedNodeIds.has(candidate.id)
				) {
					affectedNodeIds.add(candidate.id)
					changed = true
				}
		}
	}
	const initial = values.filter(row =>
		target.kind === DeletionKind.Value
			? row.id === target.id
			: affectedNodeIds.has(row.node_id)
	)
	const initialIds = new Set(initial.map(row => row.id))
	const removed = values.filter(
		row =>
			initialIds.has(row.id) || row.list_path?.some(id => initialIds.has(id))
	)
	const affectedNodes = nodes.filter(row => affectedNodeIds.has(row.id))
	const settings = await db
		.selectFrom('node_settings')
		.selectAll()
		.where('project_id', '=', projectId)
		.where('node_id', 'in', [...affectedNodeIds])
		.orderBy('id')
		.execute()
	const files = new Set(
		removed.flatMap(row =>
			isJsonObject(row.value) && typeof row.value.file === 'string'
				? [row.value.file]
				: []
		)
	)
	const listIds = new Set(
		nodes.filter(row => row.type === NodeType.list).map(row => row.id)
	)
	const fingerprint = createHash('sha256')
		.update(
			JSON.stringify({
				projectId,
				target: { kind: target.kind, id: target.id },
				nodes: affectedNodes,
				settings,
				values: removed
			})
		)
		.digest('hex')
	const impact: DeletionImpact = {
		fingerprint,
		name:
			value && isJsonObject(value.value) && typeof value.value.name === 'string'
				? value.value.name || node.name
				: node.name,
		fields: target.kind === DeletionKind.Node ? affectedNodes.length : 0,
		values: removed.length,
		listItems: removed.filter(row => listIds.has(row.node_id)).length,
		mediaFiles: files.size,
		fieldNames: affectedNodes.slice(0, 10).map(row => row.name)
	}
	return { impact, values: removed }
}

export async function requireDeletionImpact(
	db: Kysely<DB>,
	projectId: number,
	target: DeletionTarget,
	expected: string
) {
	const snapshot = await deletionSnapshot(db, projectId, target)
	if (snapshot.impact.fingerprint !== expected)
		throw new GraphQLError(
			'Content changed since this preview. Review the updated impact before deleting.',
			{ extensions: { code: 'CONFLICT' } }
		)
	return snapshot
}
