import 'dotenv/config'
import type { IncomingMessage } from 'node:http'
import type { User } from 'better-auth'
import type { ConnectionInitMessage, ServerOptions } from 'graphql-ws'
import type { Container } from 'inversify'
import { Kysely } from 'kysely'
import { splitEvery } from 'ramda'
import { Authenticator } from 'src/auth.ts'
import type { DB } from 'src/database/schema.ts'
import { v4 as uuid } from 'uuid'

export const onConnect: (c: Container) => ServerOptions<
	ConnectionInitMessage['payload'],
	{
		request: IncomingMessage
		requestId: string
		user: User | undefined
		project_id: number | undefined
	}
>['onConnect'] = container => async ctx => {
	const { connectionParams, extra, ...rest } = ctx
	const auth = container.get(Authenticator)
	const db = container.get<Kysely<DB>>(Kysely)
	const headers = splitEvery(2, extra.request.rawHeaders) as [string, string][]
	const session = await auth.api.getSession({
		headers: new Headers(headers)
	})
	const res = await db
		.selectFrom('history')
		.select('current_project_id')
		.where('user_id', '=', session?.user.id ?? '')
		.executeTakeFirst()
	
	ctx.extra = {
		...ctx.extra,
		requestId: uuid(),
		user: session?.user,
		project_id: res?.current_project_id ?? undefined
	}
}
