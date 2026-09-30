import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import type { GraphQLSchema } from 'graphql'
import { createPubSub } from 'graphql-yoga'
import { Authenticator } from '../src/auth.ts'
import type { DeletionKind } from '../src/gql/schema.ts'
import { ImportKind, type JsonArrayImportInput } from '../src/gql/schema.ts'
import { ApiKeyResolver } from '../src/resolvers/api-key-resolver.ts'
import { IoResolver } from '../src/resolvers/io-resolver.ts'
import { ListResolver } from '../src/resolvers/list-resolver.ts'
import { ProjectResolver } from '../src/resolvers/project-resolver.ts'
import { UserResolver } from '../src/resolvers/user-resolver.ts'
import {
	authenticateSession,
	authorizeProject
} from '../src/security/project-access.ts'
import { deletionSnapshot } from '../src/services/deletion-impact.ts'
import { HistoryRetention } from '../src/services/history-retention.ts'
import { ImageService } from '../src/services/image-service.ts'
import { buildInternalSchema } from '../src/services/internal-schema.ts'
import { MediaAssets } from '../src/services/media-assets.ts'
import { ProjectArchiveService } from '../src/services/project-archive.ts'
import { ProjectService } from '../src/services/project-service.ts'
import { PublicServer } from '../src/services/public-server.ts'
import { S3Client } from '../src/services/s3-client.ts'
import { SchemaContext } from '../src/services/schema-context.ts'
import { SchemaService } from '../src/services/schema-service.ts'
import { SesClient } from '../src/services/ses-client.ts'
import { Role } from '../src/types.ts'
import 'reflect-metadata'
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import { Container } from 'inversify'
import { Kysely, sql } from 'kysely'
import { Pool, type PoolClient } from 'pg'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import type { DB } from '../src/database/schema.ts'
import { NodeResolver } from '../src/resolvers/node-resolver.ts'
import { NodeSettingsResolver } from '../src/resolvers/node-settings-resolver.ts'
import { ValueResolver } from '../src/resolvers/value-resolver.ts'
import { type Context, NodeType } from '../src/types.ts'
import { createRollbackDatabase } from './rollback-database.ts'

let postgres: StartedPostgreSqlContainer
let pool: Pool
let client: PoolClient
export let db: Kysely<DB>
export let container: Container
export const requireMediaFiles = vi.fn()
export const requireImportSource = vi.fn()
export const publish = vi.fn()
export let schema: GraphQLSchema
export const pubSub = createPubSub()
export const getContent = vi.fn()
export const getBytes = vi.fn()
export const metadata = vi.fn()
export const uploadBytes = vi.fn()
export const deleteFile = vi.fn()
export const sendEmail = vi.fn()
export const ctx: Context = {
	project_id: 1,
	session_id: 'session',
	requestId: 'test',
	roles: [Role.Admin],
	user: {
		id: 'user',
		name: 'Test',
		email: 'test@example.invalid',
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	authorize: roles => authorizeProject(db, ctx, roles),
	authenticate: () => authenticateSession(db, ctx)
}

beforeAll(async () => {
	postgres = await new PostgreSqlContainer('postgres:17-alpine')
		.withUsername('groblin')
		.withCopyFilesToContainer([
			{
				source: './database/init.sql',
				target: '/docker-entrypoint-initdb.d/init.sql'
			}
		])
		.start()
	pool = new Pool({ connectionString: postgres.getConnectionUri() })
	client = await pool.connect()
	db = createRollbackDatabase(client)
	await client.query('BEGIN')
	container = new Container()
	container.bind(Kysely<DB>).toConstantValue(db)
	container
		.bind('PubSub')
		.toConstantValue({ publish, subscribe: pubSub.subscribe.bind(pubSub) })
	for (const resolver of [NodeResolver, ValueResolver, NodeSettingsResolver])
		container.bind<object>(resolver).toSelf()
	for (const resolver of [
		ApiKeyResolver,
		ListResolver,
		ProjectResolver,
		UserResolver,
		IoResolver,
		SchemaService,
		SchemaContext,
		PublicServer,
		ProjectService,
		ProjectArchiveService
	])
		container.bind<object>(resolver).toSelf()
	container
		.bind(SesClient)
		.toConstantValue({ sendEmail } as unknown as SesClient)
	container.bind(HistoryRetention).toSelf()
	container.bind(ImageService).toConstantValue({
		mediaUrl: () => 'unused',
		articleHtml: (content: string) => content
	} as unknown as ImageService)
	container.bind(S3Client).toConstantValue({
		getContent,
		deleteFile,
		getBytes,
		metadata,
		uploadBytes
	} as unknown as S3Client)
	container.bind(AwsS3).toConstantValue(
		new AwsS3({
			region: 'eu-north-1',
			credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
		})
	)
	container.bind(Authenticator).toConstantValue({
		api: { getSession: async () => null }
	} as unknown as Authenticator)
	container
		.bind(MediaAssets)
		.toSelf()
		.onActivation((_context, asset) => {
			asset.requireFiles = requireMediaFiles
			asset.requireSource = requireImportSource
			return asset
		})
	schema = buildInternalSchema(container, pubSub)
	await db
		.insertInto('user')
		.values({ ...ctx.user, image: null })
		.execute()
	await db
		.insertInto('session')
		.values({
			id: 'session',
			userId: 'user',
			token: 'synthetic',
			expiresAt: new Date(Date.now() + 86400000),
			createdAt: new Date(),
			updatedAt: new Date()
		})
		.execute()
	await client.query('COMMIT')
}, 120000)

afterAll(async () => {
	await db?.destroy()
	client?.release()
	await pool?.end()
	await postgres?.stop()
})
beforeEach(async () => {
	await client.query('BEGIN')
	await db
		.insertInto('project')
		.values([
			{ id: 1, name: 'One' },
			{ id: 2, name: 'Two' }
		])
		.execute()
	await db
		.insertInto('node')
		.values([
			{ id: 10, name: 'RootOne', project_id: 1, type: NodeType.root, order: 0 },
			{ id: 20, name: 'RootTwo', project_id: 2, type: NodeType.root, order: 0 },
			{
				id: 11,
				name: 'Own',
				project_id: 1,
				type: NodeType.string,
				parent_id: 10,
				order: 0
			},
			{
				id: 21,
				name: 'Foreign',
				project_id: 2,
				type: NodeType.string,
				parent_id: 20,
				order: 0
			}
		])
		.execute()
	await db
		.insertInto('values')
		.values({ id: 200, node_id: 21, project_id: 2, value: { text: 'private' } })
		.execute()
	await db
		.insertInto('node_settings')
		.values({
			id: 200,
			node_id: 21,
			project_id: 2,
			settings: { required: true }
		})
		.execute()
	await db
		.insertInto('project_user')
		.values({
			project_id: 1,
			user_id: 'user',
			roles: [Role.Owner],
			owner: true,
			confirmed: true
		})
		.execute()
	await db
		.updateTable('session')
		.set({ expiresAt: new Date(Date.now() + 86400000) })
		.execute()
	await sql`SELECT setval('node_id_seq', 1000), setval('values_id_seq', 1000), setval('node_settings_id_seq', 1000)`.execute(
		db
	)
	requireMediaFiles.mockReset().mockResolvedValue(undefined)
	requireImportSource.mockReset().mockResolvedValue(undefined)
	publish.mockClear()
	getContent.mockReset()
	getBytes.mockReset()
	metadata.mockReset().mockResolvedValue({ ContentType: 'image/png' })
	uploadBytes.mockReset().mockResolvedValue(undefined)
	deleteFile.mockReset().mockResolvedValue(undefined)
	sendEmail.mockReset().mockResolvedValue(undefined)
	await sql`SELECT setval(pg_get_serial_sequence('project', 'id'), 1000)`.execute(
		db
	)
})

afterEach(async () => {
	await client.query('ROLLBACK')
})

export async function impactToken(
	kind: DeletionKind,
	id: number,
	context = ctx
) {
	return (await deletionSnapshot(db, context.project_id, { kind, id })).impact
		.fingerprint
}

/** Existing mutation tests use current tokens; concurrency tests deliberately retain stale ones. */
export async function rowRevision(
	table: 'node' | 'node_settings' | 'values',
	id: number
) {
	return (
		(
			await db
				.selectFrom(table)
				.select('revision')
				.where('id', '=', id)
				.executeTakeFirst()
		)?.revision ?? 0
	)
}

export async function confirmedImport(
	data: JsonArrayImportInput,
	context = ctx
) {
	const io = container.get(IoResolver)
	const preview = await io.previewImport(data, ImportKind.Array, context)
	return io.importArray(data, context, preview.version, preview.source)
}
