export const throwError = (message: string): never => {
	throw new Error(message)
}

export const throwAny = (errors: any): never => {
	throw errors
}
