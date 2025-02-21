import Sqids from 'sqids'
import { throwError } from '../errors.ts'

const hasher = new Sqids({ minLength: 10 })

export function encryptInteger(integer: number) {
	return hasher.encode([integer])
}

export function decryptInteger(encrypted: string) {
	return (
		hasher.decode(encrypted).pop() ?? throwError('Failed to decrypt integer')
	)
}
