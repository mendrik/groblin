import { readFileSync } from 'node:fs'
import { uploadInputSchema } from '@shared/media-upload.ts'
import { GraphQLError, type GraphQLResolveInfo } from 'graphql'
import {
	GraphQLDateTime,
	GraphQLDateTimeISO,
	GraphQLJSONObject
} from 'graphql-scalars'
import { createSchema, filter, pipe } from 'graphql-yoga'
import type { Container } from 'inversify'
import { ZodError } from 'zod'
import type { Resolvers, Value } from '../gql/schema.ts'
import { ApiKeyResolver } from '../resolvers/api-key-resolver.ts'
import { IoResolver } from '../resolvers/io-resolver.ts'
import { ListResolver } from '../resolvers/list-resolver.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { NodeSettingsResolver } from '../resolvers/node-settings-resolver.ts'
import { ProjectResolver } from '../resolvers/project-resolver.ts'
import { UserResolver } from '../resolvers/user-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { projectEventFilter } from '../security/project-access.ts'
import { type Context, NodeType, type PubSub, Role, Topic } from '../types.ts'
import { ProjectArchiveService } from './project-archive.ts'

const typeDefs = readFileSync(
	new URL('../../../schema.graphql', import.meta.url),
	'utf8'
)
const readers = [Role.Owner, Role.Admin, Role.Editor, Role.Viewer]
const admins = [Role.Owner, Role.Admin]
const editors = [Role.Owner, Role.Admin, Role.Editor]

/** Every root operation rechecks membership and session validity. */
const authorized =
	<Args, Result>(
		roles: readonly Role[] | 'session',
		resolve: (args: Args, context: Context) => Result
	) =>
	async (
		_parent: unknown,
		args: Args,
		context: Context,
		info: GraphQLResolveInfo
	): Promise<Awaited<Result>> => {
		if (
			!(await (roles === 'session'
				? context.authenticate()
				: context.authorize(roles)))
		)
			throw new GraphQLError('Not authorized', {
				extensions: { code: 'FORBIDDEN' }
			})
		try {
			return await resolve(args, context)
		} catch (error) {
			if (
				error instanceof GraphQLError &&
				[
					'BAD_USER_INPUT',
					'CONFLICT',
					'FORBIDDEN',
					'NOT_FOUND',
					'EMAIL_NOT_VERIFIED'
				].includes(String(error.extensions.code))
			)
				throw error
			if (error instanceof ZodError)
				throw new GraphQLError('Invalid content or settings', {
					extensions: {
						code: 'BAD_USER_INPUT',
						issues: error.issues.map(({ path, message }) => ({ path, message }))
					}
				})
			console.error('Operation failed', {
				requestId: context.requestId,
				operation: info.fieldName,
				error
			})
			throw new GraphQLError('Request failed', {
				extensions: { code: 'INTERNAL_SERVER_ERROR' }
			})
		}
	}

export function buildInternalSchema(
	container: Container,
	events: PubSub = container.get('PubSub')
) {
	const keys = container.get(ApiKeyResolver)
	const nodes = container.get(NodeResolver)
	const values = container.get(ValueResolver)
	const settings = container.get(NodeSettingsResolver)
	const projects = container.get(ProjectResolver)
	const users = container.get(UserResolver)
	const lists = container.get(ListResolver)
	const io = container.get(IoResolver)
	const archives = container.get(ProjectArchiveService)
	const subscribeTo = (topic: Topic, roles: readonly Role[]) =>
		authorized(roles, (_args: Record<string, never>, context) =>
			pipe(
				events.subscribe(topic),
				filter((payload: number | { project_id: number }) =>
					projectEventFilter({ payload, context, roles })
				)
			)
		)
	const resolvers: Resolvers<Context> = {
		DateTime: GraphQLDateTime,
		DateTimeISO: GraphQLDateTimeISO,
		JSONObject: GraphQLJSONObject,
		NodeType,
		Role,
		Query: {
			previewProjectImport: authorized(admins, ({ key }, ctx) =>
				archives.previewImport(key, ctx)
			),
			previewImport: authorized(editors, ({ data, kind }, ctx) =>
				io.previewImport(data, kind, ctx)
			),
			getPublication: authorized(readers, (_args, ctx) =>
				projects.getPublication(ctx)
			),
			getWorkspace: authorized('session', (_args, ctx) =>
				projects.getWorkspace(ctx)
			),
			getInvitations: authorized(admins, (_args, ctx) =>
				users.getInvitations(ctx)
			),
			getInvitation: authorized('session', ({ token }) =>
				users.getInvitation(token)
			),
			getContentRevisions: authorized(readers, ({ before, limit }, ctx) =>
				projects.getContentRevisions(ctx, before ?? undefined, limit ?? 30)
			),
			getContentRevision: authorized(readers, ({ id }, ctx) =>
				projects.getContentRevision(id, ctx)
			),
			getDeletionImpact: authorized(readers, ({ target }, ctx) =>
				nodes.getDeletionImpact(target, ctx)
			),
			getApiKeys: authorized(admins, (_args, ctx) => keys.getApiKeys(ctx)),
			getNodes: authorized(readers, (_args, ctx) => nodes.getNodes(ctx)),
			getValues: authorized(readers, ({ data }, ctx) =>
				values.getValues(data, ctx)
			),
			getListPage: authorized(readers, ({ request }, ctx) =>
				lists.getListPage(ctx, request)
			),
			getListItems: authorized(readers, ({ request }, ctx) =>
				lists.getListItems(ctx, request)
			),
			getListColumns: authorized(readers, ({ node_id }, ctx) =>
				lists.getListColumns(ctx, node_id)
			),
			getNodeSettings: authorized(readers, (_args, ctx) =>
				settings.getNodeSettings(ctx)
			),
			getProject: authorized(readers, (_args, ctx) => projects.getProject(ctx)),
			getUsers: authorized(admins, (_args, ctx) => users.getUsers(ctx))
		},
		Mutation: {
			exportProject: authorized(admins, (_args, ctx) =>
				archives.exportProject(ctx)
			),
			importProjectArchive: authorized(
				'session',
				({ key, expectedSource, name }, ctx) =>
					archives.importProject(key, expectedSource, name, ctx)
			),
			publishContent: authorized(
				admins,
				({ expectedVersion, expectedPublication, revisionId }, ctx) =>
					projects.publishContent(
						expectedVersion,
						expectedPublication,
						revisionId ?? undefined,
						ctx
					)
			),
			createProject: authorized('session', ({ name }, ctx) =>
				projects.createProject(name, ctx)
			),
			switchProject: authorized('session', ({ id }, ctx) =>
				projects.switchProject(id, ctx)
			),
			renameProject: authorized(admins, ({ name, expectedVersion }, ctx) =>
				projects.renameProject(name, expectedVersion, ctx)
			),
			deleteProject: authorized(
				[Role.Owner],
				({ expectedVersion, confirmation }, ctx) =>
					projects.deleteProject(expectedVersion, confirmation, ctx)
			),
			transferProjectOwnership: authorized([Role.Owner], ({ userId }, ctx) =>
				projects.transferProjectOwnership(userId, ctx)
			),
			updateUserRole: authorized(admins, ({ id, role, expectedRole }, ctx) =>
				users.updateUserRole(ctx, id, role, expectedRole)
			),
			revokeInvitation: authorized(admins, ({ id }, ctx) =>
				users.revokeInvitation(ctx, id)
			),
			acceptInvitation: authorized('session', ({ token }, ctx) =>
				users.acceptInvitation(token, ctx)
			),
			restoreContentRevision: authorized(
				admins,
				({ id, expectedVersion }, ctx) =>
					projects.restoreContentRevision(id, expectedVersion, ctx)
			),
			createApiKey: authorized(admins, ({ data }, ctx) =>
				keys.createApiKey(ctx, data)
			),
			deleteApiKey: authorized(admins, ({ key }, ctx) =>
				keys.deleteApiKey(ctx, key)
			),
			toggleApiKey: authorized(admins, ({ key }, ctx) =>
				keys.toggleApiKey(ctx, key)
			),
			insertNode: authorized(admins, ({ data, settings }, ctx) =>
				nodes.insertNode(data, settings, ctx)
			),
			updateNode: authorized(admins, ({ data }, ctx) =>
				nodes.updateNode(data, ctx)
			),
			deleteNodeById: authorized(
				admins,
				({ id, parent_id, order, expectedImpact }, ctx) =>
					nodes.deleteNodeById(id, parent_id, order, ctx, expectedImpact)
			),
			insertListItem: authorized(editors, ({ listItem }, ctx) =>
				values.insertListItem(listItem, ctx)
			),
			deleteListItem: authorized(editors, ({ id, expectedImpact }, ctx) =>
				values.deleteListItem(id, ctx, expectedImpact)
			),
			upsertValue: authorized(editors, ({ data }, ctx) =>
				values.upsertValue(data, ctx)
			),
			truncate: authorized(editors, ({ data }, ctx) =>
				values.truncate(data, ctx)
			),
			deleteValue: authorized(editors, ({ id, expectedImpact }, ctx) =>
				values.deleteValue(id, ctx, expectedImpact)
			),
			upsertNodeSettings: authorized(admins, ({ data }, ctx) =>
				settings.upsertNodeSettings(data, ctx)
			),
			deleteUser: authorized(admins, ({ id }, ctx) =>
				users.deleteUser(ctx, id)
			),
			inviteUser: authorized(admins, ({ data }, ctx) =>
				users.inviteUser(ctx, data)
			),
			importArray: authorized(
				editors,
				({ data, expectedVersion, expectedSource }, ctx) =>
					io.importArray(data, ctx, expectedVersion, expectedSource)
			),
			importObject: authorized(
				editors,
				({ data, expectedVersion, expectedSource }, ctx) =>
					io.importObject(data, ctx, expectedVersion, expectedSource)
			),
			uploadUrl: authorized(editors, ({ data }, ctx) =>
				io.uploadUrl(uploadInputSchema.parse(data), ctx)
			),
			finalizeUpload: authorized(editors, ({ key }, ctx) =>
				io.finalizeUpload(key, ctx)
			)
		},
		Subscription: {
			workspaceUpdated: {
				subscribe: authorized('session', (_args, context) =>
					pipe(
						events.subscribe(Topic.UsersUpdated),
						filter(
							(payload: number) =>
								payload === context.project_id && context.authenticate()
						)
					)
				),
				resolve: () => true
			},
			apiKeysUpdated: {
				subscribe: subscribeTo(Topic.ApiKeysUpdated, admins),
				resolve: () => true
			},
			nodesUpdated: {
				subscribe: subscribeTo(Topic.NodesUpdated, readers),
				resolve: () => true
			},
			valuesUpdated: {
				subscribe: subscribeTo(Topic.ValuesUpdated, readers),
				resolve: (payload: Value | number) =>
					typeof payload === 'number' ? null : payload
			},
			nodeSettingsUpdated: {
				subscribe: subscribeTo(Topic.NodeSettingsUpdated, readers),
				resolve: () => true
			},
			usersUpdated: {
				subscribe: subscribeTo(Topic.UsersUpdated, admins),
				resolve: () => true
			}
		}
	}
	return createSchema<Context>({ typeDefs, resolvers })
}
