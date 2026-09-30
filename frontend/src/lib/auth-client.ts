import { createAuthClient } from 'better-auth/react'
export const {
	signIn,
	signOut,
	signUp,
	getSession,
	requestPasswordReset,
	resetPassword,
	updateUser,
	changePassword,
	sendVerificationEmail
} = createAuthClient({})

type Data<Res> =
	| {
			data: null
			error: {
				message?: string | undefined
				status: number
				statusText: string
			}
	  }
	| {
			data: Res
			error: null
	  }

export const dataOrError = <T>(data: Data<T>): NonNullable<T> => {
	if (data.error) {
		throw new Error(data.error.message ?? data.error.statusText)
	}
	const result = data.data
	if (result == null) throw new Error('The server returned no account data')
	return result
}
