import { GraphQLError } from 'graphql'
import type { Kysely } from 'kysely'
import type { DB } from '../database/schema.ts'
import type { Context, Role } from '../types.ts'
import { authorizeProject } from './project-access.ts'

/** Recheck after acquiring the project lock, since roles can change while waiting. */
export async function requireProjectRole(
	db: Kysely<DB>,
	ctx: Context,
	roles: readonly Role[]
) {
	if (!(await authorizeProject(db, ctx, roles)))
		throw new GraphQLError('Not authorized', {
			extensions: { code: 'FORBIDDEN' }
		})
}
