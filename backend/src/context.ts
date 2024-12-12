import type { LoggedInUser } from './resolvers/auth-resolver.ts'

export interface Context {
	requestId: number
	user: Required<LoggedInUser>
}
