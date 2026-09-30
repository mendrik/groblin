import { z } from 'zod'
import { contentSnapshotSchema } from './content-snapshot.ts'

export const archiveLimits = {
	compressed: 64 * 1024 * 1024,
	expanded: 128 * 1024 * 1024,
	mediaTotal: 64 * 1024 * 1024,
	mediaFile: 20 * 1024 * 1024
} as const
export const projectArchiveSchema = z.strictObject({
	format: z.literal('groblin-project'),
	formatVersion: z.literal(1),
	exportedAt: z.iso.datetime({ offset: true }),
	snapshot: contentSnapshotSchema,
	media: z
		.array(
			z.strictObject({
				key: z.string().max(100),
				contentType: z.string().min(1).max(128),
				sha256: z.string().regex(/^[0-9a-f]{64}$/),
				data: z
					.string()
					.max(28 * 1024 * 1024)
					.regex(
						/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
					)
			})
		)
		.max(10000)
})
export type ProjectArchive = z.infer<typeof projectArchiveSchema>
