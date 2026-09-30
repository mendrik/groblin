import { z } from 'zod'

export const mediaTypes = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/avif',
	'application/pdf',
	'text/plain',
	'application/octet-stream'
] as const
export const uploadInputSchema = z
	.strictObject({
		filename: z
			.string()
			.trim()
			.min(1)
			.max(255)
			.refine(
				name => [...name].every(character => character.charCodeAt(0) >= 32),
				'Filename must not contain control characters'
			),
		contentType: z.string().min(1).max(128),
		size: z
			.int()
			.min(1)
			.max(64 * 1024 * 1024),
		purpose: z.enum(['MEDIA', 'JSON_IMPORT', 'PROJECT_IMPORT'])
	})
	.superRefine((input, ctx) => {
		const max =
			input.purpose === 'MEDIA'
				? 20 * 1024 * 1024
				: input.purpose === 'JSON_IMPORT'
					? 10 * 1024 * 1024
					: 64 * 1024 * 1024
		if (input.size > max)
			ctx.addIssue({
				code: 'custom',
				message: `Upload limit is ${max / (1024 * 1024)} MiB`
			})
		if (
			input.purpose === 'MEDIA' &&
			!mediaTypes.some(type => type === input.contentType)
		)
			ctx.addIssue({ code: 'custom', message: 'Unsupported media type' })
	})
export type UploadInput = z.infer<typeof uploadInputSchema>
