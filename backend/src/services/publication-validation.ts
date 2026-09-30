import type { ContentSnapshot } from '@shared/content-snapshot.ts'
import { parseNodeSettings } from '@shared/node-settings.ts'
import { GraphQLError } from 'graphql'
import { requireProjectFile } from '../security/project-access.ts'
import { NodeType, type TreeNode } from '../types.ts'
import { isJsonObject } from '../utils/json.ts'
import { validateModelRows } from './model-validation.ts'

/** Drafts may be incomplete; publishing requires every required field in every existing list scope. */
export function validatePublication(snapshot: ContentSnapshot) {
	const projectId = snapshot.project.id
	if (
		[...snapshot.nodes, ...snapshot.settings, ...snapshot.values].some(
			row => row.project_id !== projectId
		)
	)
		throw new GraphQLError('Invalid publication project', {
			extensions: { code: 'BAD_USER_INPUT' }
		})
	const root = validateModelRows(
		snapshot.nodes,
		snapshot.settings,
		snapshot.values
	)
	const settings = new Map(
		snapshot.settings.map(row => [row.node_id, row.settings])
	)
	const values = new Map<string, ContentSnapshot['values']>()
	const key = (id: number, path: number[]) => `${id}:${path.join(',')}`
	for (const row of snapshot.values) {
		const scope = key(row.node_id, row.list_path ?? [])
		values.set(scope, [...(values.get(scope) ?? []), row])
		if (isJsonObject(row.value) && typeof row.value.file === 'string')
			requireProjectFile(projectId, row.value.file)
	}
	const visit = (node: TreeNode, path: number[]) => {
		const content = values.get(key(node.id, path)) ?? []
		const required = parseNodeSettings(
			node.type,
			settings.get(node.id)
		).required
		if (
			required &&
			node.type !== NodeType.root &&
			node.type !== NodeType.object &&
			content.length === 0
		)
			throw new GraphQLError(
				`Required field ${node.name} is missing${path.length ? ` in list item ${path[path.length - 1]}` : ''}`,
				{ extensions: { code: 'BAD_USER_INPUT' } }
			)
		if (node.type === NodeType.list) {
			for (const item of content)
				for (const child of node.nodes) visit(child, [...path, item.id])
		} else for (const child of node.nodes) visit(child, path)
	}
	visit(root, [])
	return root
}
