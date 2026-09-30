import { randomUUID } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { GraphQLError } from 'graphql'
import type { ConnectionInitMessage, Context as WsContext } from 'graphql-ws'
import type { Container } from 'inversify'
import { Kysely } from 'kysely'
import { Authenticator } from '../auth.ts'
import type { DB } from '../database/schema.ts'
import {
	authenticateSession,
	authorizeProject
} from '../security/project-access.ts'
import type { Context } from '../types.ts'

type Extra = { request: IncomingMessage } & Partial<Context>
export const onConnect =
	(container: Container, requestedProject?: unknown) =>
	async (ctx: WsContext<ConnectionInitMessage['payload'], Extra>) => {
		const headers = new Headers()
		for (let i = 0; i < ctx.extra.request.rawHeaders.length; i += 2) {
			headers.append(
				ctx.extra.request.rawHeaders[i],
				ctx.extra.request.rawHeaders[i + 1]
			)
		}
		const session = await container
			.get(Authenticator)
			.api.getSession({ headers, query: { disableCookieCache: true } })
		if (!session) throw new Error('Unauthorized')
		const db = container.get<Kysely<DB>>(Kysely)
		if (
			requestedProject !== undefined &&
			(typeof requestedProject !== 'number' ||
				!Number.isSafeInteger(requestedProject) ||
				requestedProject <= 0)
		)
			throw new GraphQLError('Invalid project selection', {
				extensions: { code: 'BAD_USER_INPUT' }
			})
		const explicit =
			typeof requestedProject === 'number'
				? await db
						.selectFrom('project_user')
						.select(['project_id', 'roles'])
						.where('project_id', '=', requestedProject)
						.where('user_id', '=', session.user.id)
						.where('confirmed', '=', true)
						.executeTakeFirst()
				: undefined
		const membership = await db
			.selectFrom('history')
			.innerJoin('project_user', join =>
				join
					.onRef('project_user.project_id', '=', 'history.current_project_id')
					.onRef('project_user.user_id', '=', 'history.user_id')
			)
			.select(['project_user.project_id', 'project_user.roles'])
			.where('history.user_id', '=', session.user.id)
			.where('project_user.confirmed', '=', true)
			.executeTakeFirst()
		const selected =
			requestedProject !== undefined
				? explicit
				: (membership ??
					(await db
						.selectFrom('project_user')
						.select(['project_id', 'roles'])
						.where('user_id', '=', session.user.id)
						.where('confirmed', '=', true)
						.orderBy('project_id')
						.executeTakeFirst()))
		const context: Context = {
			requestId: randomUUID(),
			user: session.user,
			session_id: session.session.id,
			project_id:
				typeof requestedProject === 'number'
					? requestedProject
					: (selected?.project_id ?? 0),
			roles: selected?.roles ?? [],
			authorize: roles => authorizeProject(db, context, roles),
			authenticate: () => authenticateSession(db, context)
		}
		Object.assign(ctx.extra, context)
	}
