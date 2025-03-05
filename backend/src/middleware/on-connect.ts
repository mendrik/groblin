import 'dotenv/config'
import type { ServerOptions } from 'graphql-ws'
import jwt from 'jsonwebtoken'
import type { User } from 'src/database/schema.ts'
import { v4 as uuid } from 'uuid'

export const onConnect: ServerOptions['onConnect'] = ctx => {
	const { connectionParams, ...rest } = ctx
	const token = connectionParams?.authToken as string | undefined
	if (token && process.env.JWT_SECRET) {
		const user = jwt.verify(token, process.env.JWT_SECRET) as Required<User>
		ctx.extra = {
			requestId: uuid(),
			user
		}
	}
}
