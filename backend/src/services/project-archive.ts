import { createHash, randomUUID } from 'node:crypto'
import { promisify } from 'node:util'
import { gunzip, gzip } from 'node:zlib'
import { S3Client as AwsS3, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { contentAssetKeys, normalizeArticle } from '@shared/article-assets.ts'
import type { ContentSnapshot } from '@shared/content-snapshot.ts'
import {
	archiveLimits,
	type ProjectArchive,
	projectArchiveSchema
} from '@shared/project-archive.ts'
import { projectNameSchema } from '@shared/project-roles.ts'
import { GraphQLError } from 'graphql'
import { inject, injectable, optional } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB } from '../database/schema.ts'
import {
	authenticateSession,
	requireProjectFile
} from '../security/project-access.ts'
import { requireProjectRole } from '../security/require-role.ts'
import { type Context, NodeType, Role } from '../types.ts'
import { isJsonObject } from '../utils/json.ts'
import {
	readContentSnapshot,
	recordContentRevision
} from './content-revisions.ts'
import { inspectMedia, MediaAssets } from './media-assets.ts'
import { validateModelRows, validateProjectModel } from './model-validation.ts'
import { ProjectService } from './project-service.ts'
import { S3Client } from './s3-client.ts'

const compress = promisify(gzip)
const expand = promisify(gunzip)
const hash = (bytes: Uint8Array) =>
	createHash('sha256').update(bytes).digest('hex')
const invalid = (message: string): never => {
	throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}
export const snapshotMedia = (snapshot: ContentSnapshot) => [
	...new Set(snapshot.values.flatMap(row => contentAssetKeys(row.value)))
]

export function validateArchive(archive: ProjectArchive) {
	const { snapshot } = archive
	const projectId = snapshot.project.id
	const unique = (ids: number[]) => new Set(ids).size === ids.length
	if (
		!unique(snapshot.nodes.map(row => row.id)) ||
		!unique(snapshot.values.map(row => row.id)) ||
		!unique(snapshot.settings.map(row => row.id)) ||
		!unique(snapshot.settings.map(row => row.node_id))
	)
		invalid('Archive contains duplicate IDs')
	if (
		[...snapshot.nodes, ...snapshot.settings, ...snapshot.values].some(
			row => row.project_id !== projectId
		)
	)
		invalid('Archive contains foreign project data')
	const nodeIds = new Set(snapshot.nodes.map(row => row.id))
	if (snapshot.settings.some(row => !nodeIds.has(row.node_id)))
		invalid('Archive contains orphan settings')
	const root = validateModelRows(
		snapshot.nodes,
		snapshot.settings,
		snapshot.values
	)
	const scalarScopes = new Set<string>()
	const externalScopes = new Set<string>()
	const types = new Map(snapshot.nodes.map(node => [node.id, node.type]))
	for (const value of snapshot.values) {
		const scope = `${value.node_id}:${(value.list_path ?? []).join(',')}`
		if (types.get(value.node_id) !== NodeType.list) {
			if (scalarScopes.has(scope))
				invalid('Archive contains duplicate scalar content')
			scalarScopes.add(scope)
		}
		if (value.external_id !== null) {
			const identity = `${scope}:${value.external_id}`
			if (externalScopes.has(identity))
				invalid('Archive contains duplicate external IDs')
			externalScopes.add(identity)
		}
	}
	const required = new Set(snapshotMedia(snapshot))
	const files = new Map<string, Buffer>()
	let total = 0
	for (const media of archive.media) {
		requireProjectFile(projectId, media.key)
		if (files.has(media.key) || !required.has(media.key))
			invalid('Archive contains unexpected or duplicate media')
		const bytes = Buffer.from(media.data, 'base64')
		total += bytes.length
		if (
			bytes.length > archiveLimits.mediaFile ||
			total > archiveLimits.mediaTotal
		)
			invalid('Archive media exceeds the size limit')
		if (bytes.toString('base64') !== media.data || hash(bytes) !== media.sha256)
			invalid('Archive media checksum does not match')
		for (const row of snapshot.values) {
			if (
				isJsonObject(row.value) &&
				row.value.file === media.key &&
				(row.value.contentType !== media.contentType ||
					row.value.size !== bytes.length)
			)
				invalid('Archive media metadata does not match its bytes')
			if (
				contentAssetKeys(row.value).includes(media.key) &&
				isJsonObject(row.value) &&
				Array.isArray(row.value.assets) &&
				!media.contentType.startsWith('image/')
			)
				invalid('Article assets must be images')
		}
		files.set(media.key, bytes)
	}
	if (required.size !== files.size)
		invalid('Archive is missing referenced media')
	return { root, files, mediaBytes: total }
}

@injectable()
export class ProjectArchiveService {
	@inject(MediaAssets) private assets: MediaAssets
	@inject(Kysely) private db: Kysely<DB>
	@inject(S3Client) private storage: S3Client
	@inject('S3SigningClient') @optional() private signing: AwsS3 | undefined
	@inject(AwsS3) private aws: AwsS3
	@inject(ProjectService) private projects: ProjectService

	async exportData(ctx: Context) {
		const snapshot = await this.db
			.transaction()
			.setIsolationLevel('repeatable read')
			.execute(async trx => {
				await requireProjectRole(trx, ctx, [Role.Admin])
				return readContentSnapshot(trx, ctx.project_id)
			})
		const media: ProjectArchive['media'] = []
		let total = 0
		for (const key of snapshotMedia(snapshot)) {
			requireProjectFile(ctx.project_id, key)
			const bytes = await this.storage.getBytes(key, archiveLimits.mediaFile)
			total += bytes.length
			if (total > archiveLimits.mediaTotal)
				invalid('Project media exceeds the export size limit')
			const metadata = await this.storage.metadata(key)
			media.push({
				key,
				contentType: metadata.ContentType ?? 'application/octet-stream',
				sha256: hash(bytes),
				data: Buffer.from(bytes).toString('base64')
			})
		}
		const archive = projectArchiveSchema.parse({
			format: 'groblin-project',
			formatVersion: 1,
			exportedAt: new Date().toISOString(),
			snapshot,
			media
		})
		validateArchive(archive)
		const raw = Buffer.from(JSON.stringify(archive))
		if (raw.length > archiveLimits.expanded)
			invalid('Project exceeds the export size limit')
		const compressed = await compress(raw)
		if (compressed.length > archiveLimits.compressed)
			invalid('Project exceeds the compressed export size limit')
		return compressed
	}

	async exportProject(ctx: Context) {
		const data = await this.exportData(ctx)
		const key = `project_${ctx.project_id}/${randomUUID()}`
		const filename = `groblin-project-${ctx.project_id}.groblin.gz`
		await this.db
			.insertInto('media_asset')
			.values({
				key,
				project_id: ctx.project_id,
				uploaded_by: ctx.user.id,
				filename,
				content_type: 'application/gzip',
				size: data.length,
				purpose: 'EXPORT'
			})
			.execute()
		await this.storage.uploadBytes(key, data, {
			ContentType: 'application/gzip',
			Metadata: {
				purpose: 'export',
				expiresAt: new Date(Date.now() + 86400000).toISOString()
			}
		})
		return {
			filename,
			bytes: data.length,
			url: await getSignedUrl(
				this.signing ?? this.aws,
				new GetObjectCommand({
					Bucket: process.env.AWS_BUCKET,
					Key: key,
					ResponseContentDisposition: `attachment; filename="${filename}"`
				}),
				{ expiresIn: 3600 }
			)
		}
	}

	private async read(key: string, ctx: Context) {
		requireProjectFile(ctx.project_id, key)
		await requireProjectRole(this.db, ctx, [Role.Admin])
		await this.assets.requireSource(
			ctx.project_id,
			key,
			'PROJECT_IMPORT',
			ctx.user.id
		)
		const bytes = await this.storage.getBytes(key, archiveLimits.compressed)
		let archive: ProjectArchive
		try {
			const raw = await expand(bytes, {
				maxOutputLength: archiveLimits.expanded
			})
			archive = projectArchiveSchema.parse(JSON.parse(raw.toString('utf8')))
		} catch {
			return invalid(
				'Invalid project archive or unsupported format. Choose a v1 .groblin.gz archive within the size limit.'
			)
		}
		const validated = validateArchive(archive)
		for (const media of archive.media) {
			const file = validated.files.get(media.key)
			if (!file) throw new Error('Missing archive media')
			await inspectMedia(file, media.contentType)
		}
		return { archive, ...validated, source: hash(bytes) }
	}

	async previewImport(key: string, ctx: Context) {
		const { archive, source, mediaBytes } = await this.read(key, ctx)
		return {
			source,
			name: archive.snapshot.project.name,
			fields: archive.snapshot.nodes.length,
			values: archive.snapshot.values.length,
			mediaFiles: archive.media.length,
			mediaBytes
		}
	}

	async importProject(
		key: string,
		expectedSource: string,
		name: string,
		ctx: Context
	) {
		if (!(await authenticateSession(this.db, ctx)))
			throw new GraphQLError('Not authorized', {
				extensions: { code: 'FORBIDDEN' }
			})
		const receipt = await this.db
			.selectFrom('project_import_receipt')
			.select('project_id')
			.where('user_id', '=', ctx.user.id)
			.where('upload_key', '=', key)
			.where('source_hash', '=', expectedSource)
			.executeTakeFirst()
		if (receipt) {
			if (!receipt.project_id)
				return invalid(
					'The imported project was deleted. Upload the archive again to create a new copy.'
				)
			await this.projects.switchProject(ctx.user.id, receipt.project_id)
			return receipt.project_id
		}
		const data = await this.read(key, ctx)
		if (data.source !== expectedSource)
			throw new GraphQLError('The archive changed. Review it again.', {
				extensions: { code: 'CONFLICT' }
			})
		const projectName = projectNameSchema.parse(name)
		const allocation = await sql<{
			id: number
		}>`SELECT nextval(pg_get_serial_sequence('project', 'id'))::int AS id`.execute(
			this.db
		)
		const projectId = allocation.rows[0]?.id
		if (!projectId) throw new Error('Could not allocate project ID')
		const job = await this.db
			.insertInto('media_cleanup_job')
			.values({
				prefix: `project_${projectId}/`,
				not_before: new Date(Date.now() + 86400000)
			})
			.returning('id')
			.executeTakeFirstOrThrow()
		try {
			return await this.db.transaction().execute(async trx => {
				await trx
					.selectFrom('media_cleanup_job')
					.select('id')
					.where('id', '=', job.id)
					.forUpdate()
					.executeTakeFirstOrThrow()
				await trx
					.selectFrom('user')
					.select('id')
					.where('id', '=', ctx.user.id)
					.forUpdate()
					.executeTakeFirstOrThrow()
				await requireProjectRole(trx, ctx, [Role.Admin])
				const duplicate = await trx
					.selectFrom('project_import_receipt')
					.select('project_id')
					.where('user_id', '=', ctx.user.id)
					.where('upload_key', '=', key)
					.where('source_hash', '=', expectedSource)
					.executeTakeFirst()
				if (duplicate?.project_id) {
					await trx
						.deleteFrom('media_cleanup_job')
						.where('id', '=', job.id)
						.execute()
					await this.projects.rememberProject(
						trx,
						ctx.user.id,
						duplicate.project_id
					)
					return duplicate.project_id
				}
				await trx
					.insertInto('project')
					.values({ id: projectId, name: projectName })
					.execute()
				await trx
					.insertInto('project_user')
					.values({
						project_id: projectId,
						user_id: ctx.user.id,
						roles: [Role.Owner],
						owner: true,
						confirmed: true
					})
					.execute()
				const nodeMap = new Map<number, number>()
				const insertNode = async (node: typeof data.root): Promise<void> => {
					const parentId =
						node.parent_id == null ? null : nodeMap.get(node.parent_id)
					if (parentId === undefined) throw new Error('Missing archive parent')
					const created = await trx
						.insertInto('node')
						.values({
							project_id: projectId,
							parent_id: parentId,
							name: node.name,
							type: node.type,
							order: node.order,
							depth: node.depth
						})
						.returning('id')
						.executeTakeFirstOrThrow()
					nodeMap.set(node.id, created.id)
					for (const child of node.nodes) await insertNode(child)
				}
				await insertNode(data.root)
				const getNodeId = (id: number) => {
					const mapped = nodeMap.get(id)
					if (!mapped) throw new Error('Missing archive field')
					return mapped
				}
				for (const setting of data.archive.snapshot.settings)
					await trx
						.insertInto('node_settings')
						.values({
							project_id: projectId,
							node_id: getNodeId(setting.node_id),
							settings: setting.settings,
							priority: setting.priority,
							required: setting.required
						})
						.execute()
				const mediaMap = new Map<string, string>()
				for (const media of data.archive.media) {
					const newKey = `project_${projectId}/${randomUUID()}`
					const bytes = data.files.get(media.key)
					if (!bytes) throw new Error('Missing archive media bytes')
					const dimensions = await inspectMedia(bytes, media.contentType)
					await trx
						.insertInto('media_asset')
						.values({
							key: newKey,
							project_id: projectId,
							uploaded_by: ctx.user.id,
							filename: 'Imported media',
							content_type: media.contentType,
							size: bytes.length,
							purpose: 'MEDIA',
							verified_at: new Date(),
							sha256: media.sha256,
							...dimensions
						})
						.execute()
					await this.storage.uploadBytes(newKey, bytes, {
						ContentType: media.contentType
					})
					mediaMap.set(media.key, newKey)
				}
				const valueMap = new Map<number, number>()
				for (const row of [...data.archive.snapshot.values].sort(
					(a, b) =>
						(a.list_path?.length ?? 0) - (b.list_path?.length ?? 0) ||
						a.id - b.id
				)) {
					const path = (row.list_path ?? []).map(id => {
						const mapped = valueMap.get(id)
						if (!mapped) throw new Error('Missing archive list item')
						return mapped
					})
					const value =
						isJsonObject(row.value) && typeof row.value.file === 'string'
							? { ...row.value, file: mediaMap.get(row.value.file) }
							: isJsonObject(row.value) &&
									typeof row.value.content === 'string' &&
									Array.isArray(row.value.assets)
								? normalizeArticle(row.value.content, undefined, key => {
										const mapped = mediaMap.get(key)
										if (!mapped) throw new Error('Missing article asset')
										return mapped
									})
								: row.value
					const created = await trx
						.insertInto('values')
						.values({
							project_id: projectId,
							node_id: getNodeId(row.node_id),
							list_path: path,
							value,
							order: row.order,
							external_id: row.external_id
						})
						.returning('id')
						.executeTakeFirstOrThrow()
					valueMap.set(row.id, created.id)
				}
				await validateProjectModel(trx, projectId)
				await recordContentRevision(
					trx,
					{ ...ctx, project_id: projectId },
					'Imported project archive'
				)
				await this.projects.rememberProject(trx, ctx.user.id, projectId)
				await trx
					.insertInto('project_import_receipt')
					.values({
						user_id: ctx.user.id,
						upload_key: key,
						source_hash: expectedSource,
						project_id: projectId
					})
					.execute()
				await trx
					.deleteFrom('media_cleanup_job')
					.where('id', '=', job.id)
					.execute()
				return projectId
			})
		} catch (error) {
			await this.db
				.updateTable('media_cleanup_job')
				.set({ not_before: new Date() })
				.where('id', '=', job.id)
				.execute()
			throw error
		}
	}
}
