import { NodeType } from '@shared/node-types.ts'
import { roleAllowed } from '@shared/project-roles.ts'
import { GraphQLError } from 'graphql'
import type { Kysely } from 'kysely'
import type { DB } from '../database/schema.ts'
import type { Context } from '../types.ts'
import { parseNode } from '../utils/parse-node.ts'

export async function requireNode(
	db: Kysely<DB>,
	projectId: number,
	id: number
) {
	const node = await db
		.selectFrom('node')
		.selectAll()
		.where('id', '=', id)
		.where('project_id', '=', projectId)
		.executeTakeFirst()
	if (!node) throw new Error('Node not found')
	return parseNode(node)
}

/** A value must sit under exactly the ordered list ancestors of its node. */
export async function requireListPath(
	db: Kysely<DB>,
	projectId: number,
	nodeId: number,
	input: number[] | null | undefined
) {
	const path = input ?? []
	const fail = (): never => {
		throw new GraphQLError('Invalid list path', {
			extensions: { code: 'BAD_USER_INPUT' }
		})
	}
	const nodes = await db
		.selectFrom('node')
		.selectAll()
		.where('project_id', '=', projectId)
		.execute()
	const byId = new Map(nodes.map(node => [node.id, node]))
	const target = byId.get(nodeId)
	if (!target) return fail()
	const ancestors: number[] = []
	const visited = new Set([nodeId])
	let parentId = target.parent_id
	while (parentId != null) {
		const parent = byId.get(parentId)
		if (!parent || visited.has(parentId)) return fail()
		visited.add(parentId)
		if (parent.type === NodeType.list) ancestors.unshift(parent.id)
		parentId = parent.parent_id
	}
	if (path.length !== ancestors.length || new Set(path).size !== path.length)
		return fail()
	if (!path.length) return
	const rows = await db
		.selectFrom('values')
		.select(['id', 'node_id', 'list_path'])
		.where('project_id', '=', projectId)
		.where('id', 'in', path)
		.execute()
	const byValueId = new Map(rows.map(row => [row.id, row]))
	for (const [index, id] of path.entries()) {
		const row = byValueId.get(id)
		const rowPath = row?.list_path ?? []
		if (
			!row ||
			row.node_id !== ancestors[index] ||
			rowPath.length !== index ||
			!rowPath.every((ancestor, i) => ancestor === path[i])
		)
			return fail()
	}
}

export function requireProjectFile(projectId: number, key: string) {
	if (!new RegExp(`^project_${projectId}/[0-9a-f-]{36}$`).test(key))
		throw new Error('Invalid upload')
}

export async function authorizeProject(
	db: Kysely<DB>,
	ctx: Pick<Context, 'user' | 'session_id' | 'project_id'>,
	roles: readonly string[]
) {
	if (!ctx.user || !ctx.session_id || !ctx.project_id) return false
	const membership = await db
		.selectFrom('project_user')
		.innerJoin('session', 'session.userId', 'project_user.user_id')
		.select('project_user.roles')
		.where('project_user.user_id', '=', ctx.user.id)
		.where('project_user.project_id', '=', ctx.project_id)
		.where('project_user.confirmed', '=', true)
		.where('session.id', '=', ctx.session_id)
		.where('session.expiresAt', '>', new Date())
		.executeTakeFirst()
	return !!membership && roleAllowed(membership.roles, roles)
}

export async function authenticateSession(
	db: Kysely<DB>,
	ctx: Pick<Context, 'user' | 'session_id'>
) {
	if (!ctx.user || !ctx.session_id) return false
	return !!(await db
		.selectFrom('session')
		.select('id')
		.where('id', '=', ctx.session_id)
		.where('userId', '=', ctx.user.id)
		.where('expiresAt', '>', new Date())
		.executeTakeFirst())
}

export async function projectEventFilter({
	payload,
	context,
	roles = []
}: {
	payload: number | { project_id: number }
	context: Context
	roles?: readonly string[]
}) {
	const projectId = typeof payload === 'number' ? payload : payload?.project_id
	return projectId === context.project_id && (await context.authorize(roles))
}
