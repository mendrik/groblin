import { createHmac, timingSafeEqual } from 'node:crypto'

const signature = (
	id: number | string,
	version: string,
	size: string,
	expires: string
) => {
	const secret = process.env.MEDIA_SIGNING_SECRET
	if (!secret || secret.length < 32)
		throw new Error('MEDIA_SIGNING_SECRET must contain at least 32 characters')
	return createHmac('sha256', secret)
		.update(JSON.stringify([id, version, size, expires]))
		.digest('hex')
}
export const signMedia = (
	id: number | string,
	version: string,
	size: string,
	expires: string
) => signature(id, version, size, expires)
export function verifyMedia(
	id: number | string,
	version: string,
	size: string,
	expires: string,
	token: string
) {
	if (
		!/^\d+$/.test(expires) ||
		Number(expires) < Date.now() ||
		!/^[0-9a-f]{64}$/.test(token)
	)
		return false
	return timingSafeEqual(
		Buffer.from(token, 'hex'),
		Buffer.from(signature(id, version, size, expires), 'hex')
	)
}
