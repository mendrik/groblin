import 'dotenv/config'
import type { ServerOptions } from 'graphql-ws'
import jwt from 'jsonwebtoken'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'

export const onConnect: ServerOptions['onConnect'] = context => {
	const token = context.connectionParams?.authToken as string | undefined

	if (token && process.env.JWT_SECRET) {
		const user = jwt.verify(
			token,
			process.env.JWT_SECRET
		) as Required<LoggedInUser>
		console.log(user)
		context.extra = user
	}
	return true
}
