import { createCipheriv, createDecipheriv, pbkdf2Sync } from 'node:crypto'

const staticString = 'my-secret-string'
const salt = '3456salt'

const derivedKey = pbkdf2Sync(staticString, salt, 100000, 48, 'sha256')
const key = derivedKey.subarray(0, 32) // First 32 bytes for the key
const iv = derivedKey.subarray(32, 48)

export function encryptInteger(integer: number) {
	const cipher = createCipheriv('aes-256-cbc', key, iv)
	let encrypted = cipher.update(integer.toString(), 'utf8', 'hex')
	encrypted += cipher.final('hex')
	return encrypted
}

export function decryptInteger(encrypted: string) {
	const decipher = createDecipheriv('aes-256-cbc', key, iv)
	let decrypted = decipher.update(encrypted, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	return Number.parseInt(decrypted)
}
