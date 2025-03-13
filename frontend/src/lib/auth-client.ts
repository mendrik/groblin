import { createAuthClient } from 'better-auth/react'
export const { signIn, signOut, signUp, getSession } = createAuthClient({})

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
		throw data.error
	}
	return data.data as NonNullable<T>
}
