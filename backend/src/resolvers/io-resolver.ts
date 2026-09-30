import { createHash } from 'node:crypto'
import { jsonImportInputSchema } from '@shared/imports.ts'
import type { UploadInput } from '@shared/media-upload.ts'
import { GraphQLError } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { z } from 'zod'
import type { DB } from '../database/schema.ts'
import {
	ImportKind,
	type ImportPreview,
	type JsonArrayImportInput
} from '../gql/schema.ts'
import {
	requireListPath,
	requireNode,
	requireProjectFile
} from '../security/project-access.ts'
import { requireProjectRole } from '../security/require-role.ts'
import {
	ensureContentBaseline,
	readContentSnapshot,
	recordContentRevision,
	requireRevision
} from '../services/content-revisions.ts'
import { importJson } from '../services/importer.ts'
import { MediaAssets } from '../services/media-assets.ts'
import { lockProject } from '../services/model-validation.ts'
import { S3Client } from '../services/s3-client.ts'
import { type Context, NodeType, type PubSub, Role, Topic } from '../types.ts'
import { isJsonObject } from '../utils/json.ts'

export type { JsonArrayImportInput, Upload } from '../gql/schema.ts'

const inputSchema =
	jsonImportInputSchema satisfies z.ZodType<JsonArrayImportInput>
class PreviewComplete extends Error {
	constructor(readonly preview: ImportPreview) {
		super('Import preview complete')
	}
}

@injectable()
export class IoResolver {
	@inject(Kysely)
	private db: Kysely<DB>
	@inject('PubSub')
	private pubSub: PubSub
	@inject(S3Client)
	private readonly s3: S3Client
	@inject(MediaAssets)
	private assets: MediaAssets

	private async applyImport(
		input: JsonArrayImportInput,
		ctx: Context,
		kind: ImportKind,
		confirmation?: { version: number; source: string }
	): Promise<ImportPreview | true> {
		const payload = inputSchema.parse(input)
		const { project_id } = ctx
		requireProjectFile(project_id, payload.data)
		await requireProjectRole(
			this.db,
			ctx,
			payload.structure ? [Role.Admin] : [Role.Admin, Role.Editor]
		)
		await this.assets.requireSource(
			project_id,
			payload.data,
			'JSON_IMPORT',
			ctx.user.id
		)
		const raw = await this.s3.getContent(payload.data, 10 * 1024 * 1024)
		let json: z.infer<ReturnType<typeof z.json>>
		try {
			json = z.json().parse(JSON.parse(raw))
		} catch {
			throw new GraphQLError('Invalid JSON import', {
				extensions: { code: 'BAD_USER_INPUT' }
			})
		}
		if (
			kind === ImportKind.Array
				? !Array.isArray(json) || json.length > 10000
				: !isJsonObject(json)
		)
			throw new GraphQLError(
				'Choose a JSON array with at most 10000 objects, or an object for object import',
				{ extensions: { code: 'BAD_USER_INPUT' } }
			)
		const source = createHash('sha256')
			.update(JSON.stringify([project_id, kind, payload, raw]))
			.digest('hex')
		const result = await this.db
			.transaction()
			.execute(async trx => {
				await lockProject(trx, project_id)
				await requireProjectRole(
					trx,
					ctx,
					payload.structure ? [Role.Admin] : [Role.Admin, Role.Editor]
				)
				const project = await trx
					.selectFrom('project')
					.select('version')
					.where('id', '=', project_id)
					.executeTakeFirstOrThrow()
				if (confirmation) {
					requireRevision(confirmation.version, project.version, 'Project')
					if (confirmation.source !== source)
						throw new GraphQLError(
							'The uploaded file changed. Review the import again.',
							{ extensions: { code: 'CONFLICT' } }
						)
				}
				const node = await requireNode(trx, project_id, payload.node_id)
				if (
					kind === ImportKind.Array
						? node.type !== NodeType.list
						: ![NodeType.object, NodeType.root].includes(node.type)
				)
					throw new GraphQLError(
						'Choose a list for array import or a container for object import',
						{ extensions: { code: 'BAD_USER_INPUT' } }
					)
				await requireListPath(
					trx,
					project_id,
					payload.node_id,
					payload.list_path
				)
				const before = !confirmation
					? await readContentSnapshot(trx, project_id)
					: undefined
				if (confirmation) await ensureContentBaseline(trx, ctx)
				await importJson(trx, project_id, json, payload)
				if (before) {
					const after = await readContentSnapshot(trx, project_id)
					const oldValues = new Map(
						before.values.map(value => [value.id, value])
					)
					const newIds = new Set(after.values.map(value => value.id))
					throw new PreviewComplete({
						version: project.version,
						source,
						name: node.name,
						fieldsAdded: after.nodes.length - before.nodes.length,
						valuesAdded: after.values.filter(value => !oldValues.has(value.id))
							.length,
						valuesChanged: after.values.filter(
							value =>
								oldValues.has(value.id) &&
								oldValues.get(value.id)?.revision !== value.revision
						).length,
						valuesRemoved: before.values.filter(value => !newIds.has(value.id))
							.length
					})
				}
				await recordContentRevision(trx, ctx, `Imported into ${node.name}`)
				return true as const
			})
			.catch(error => {
				if (error instanceof PreviewComplete) return error.preview
				throw error
			})
		if (result === true) {
			this.pubSub.publish(Topic.NodesUpdated, project_id)
			this.pubSub.publish(Topic.SomeNodeSettingsUpdated, project_id)
			this.pubSub.publish(Topic.ValuesUpdated, project_id)
			await this.s3
				.deleteFile(payload.data)
				.catch(() =>
					console.warn('Import accepted; source upload cleanup will need retry')
				)
		}
		return result
	}

	async previewImport(
		data: JsonArrayImportInput,
		kind: ImportKind,
		ctx: Context
	) {
		const result = await this.applyImport(data, ctx, kind)
		if (result === true)
			throw new Error('Import preview unexpectedly committed')
		return result
	}
	async importArray(
		data: JsonArrayImportInput,
		ctx: Context,
		expectedVersion: number,
		expectedSource: string
	) {
		return (
			(await this.applyImport(data, ctx, ImportKind.Array, {
				version: expectedVersion,
				source: expectedSource
			})) === true
		)
	}
	async importObject(
		data: JsonArrayImportInput,
		ctx: Context,
		expectedVersion: number,
		expectedSource: string
	) {
		return (
			(await this.applyImport(data, ctx, ImportKind.Object, {
				version: expectedVersion,
				source: expectedSource
			})) === true
		)
	}
	async uploadUrl(data: UploadInput, ctx: Context) {
		return this.assets.prepare(data, ctx)
	}
	async finalizeUpload(key: string, ctx: Context) {
		const media = await this.assets.finalize(key, ctx)
		return {
			...media,
			width: media.width ?? null,
			height: media.height ?? null
		}
	}
}
