import { z } from 'zod'

export const jsonImportInputSchema = z.strictObject({
	node_id: z.int().positive(),
	data: z.string().min(1),
	structure: z.boolean(),
	external_id: z.string().trim().min(1).max(128).nullish(),
	list_path: z.array(z.int().positive()).max(64).nullish()
})
export type JsonImport = z.infer<typeof jsonImportInputSchema>
