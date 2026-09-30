import { createHash, randomBytes } from 'node:crypto'
import {
	invitationEmailSchema,
	invitationRoleSchema,
	memberRole,
	roleSchema
} from '@shared/project-roles.ts'
import { GraphQLError } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { z } from 'zod'
import type { DB } from '../database/schema.ts'
import type { Invite, ProjectUser } from '../gql/schema.ts'
import { requireProjectRole } from '../security/require-role.ts'
import { lockProject } from '../services/model-validation.ts'
import { ProjectService } from '../services/project-service.ts'
import { SesClient } from '../services/ses-client.ts'
import { type Context, type PubSub, Role, Topic } from '../types.ts'

export type { Invite, ProjectUser } from '../gql/schema.ts'

const hashToken = (token: string) =>
	createHash('sha256').update(token).digest('hex')
const tokenSchema = z.string().regex(/^gri_[A-Za-z0-9_-]{43}$/)
const notFound = () =>
	new GraphQLError('Invitation is unavailable or expired', {
		extensions: { code: 'NOT_FOUND' }
	})
const invitationFields = [
	'id',
	'email',
	'role',
	'created_at',
	'expires_at',
	'accepted_at',
	'revoked_at'
] as const

@injectable()
export class UserResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@inject(SesClient)
	private mail: SesClient

	@inject(ProjectService)
	private projects: ProjectService

	async getUsers(ctx: Context): Promise<ProjectUser[]> {
		return this.db
			.selectFrom('user')
			.innerJoin('project_user', 'project_user.user_id', 'user.id')
			.select([
				'id',
				'name',
				'email',
				'project_user.confirmed',
				'project_user.roles',
				'project_user.owner'
			])
			.where('project_id', '=', ctx.project_id)
			.orderBy('name')
			.execute()
			.then(rows => rows.map(row => ({ ...row, role: memberRole(row.roles) })))
	}

	async deleteUser(ctx: Context, id: string): Promise<boolean> {
		const result = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const member = await trx
				.selectFrom('project_user')
				.select('owner')
				.where('user_id', '=', id)
				.where('project_id', '=', ctx.project_id)
				.executeTakeFirst()
			if (!member) return false
			if (member.owner)
				throw new GraphQLError('Transfer ownership before removing the Owner', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			await trx
				.deleteFrom('project_user')
				.where('user_id', '=', id)
				.where('project_id', '=', ctx.project_id)
				.execute()
			await trx
				.updateTable('history')
				.set({ current_project_id: null })
				.where('user_id', '=', id)
				.where('current_project_id', '=', ctx.project_id)
				.execute()
			return true
		})
		if (result) this.pubSub.publish(Topic.UsersUpdated, ctx.project_id)
		return result
	}

	async updateUserRole(
		ctx: Context,
		id: string,
		role: Role,
		expectedRole: Role
	) {
		const validated = invitationRoleSchema.parse(role)
		const result = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const member = await trx
				.selectFrom('project_user')
				.selectAll()
				.where('user_id', '=', id)
				.where('project_id', '=', ctx.project_id)
				.where('confirmed', '=', true)
				.executeTakeFirst()
			if (!member)
				throw new GraphQLError('Member not found', {
					extensions: { code: 'NOT_FOUND' }
				})
			if (member.owner)
				throw new GraphQLError('Use ownership transfer to change the Owner', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			if (memberRole(member.roles) !== expectedRole)
				throw new GraphQLError(
					'Member role changed. Refresh before trying again.',
					{ extensions: { code: 'CONFLICT' } }
				)
			await trx
				.updateTable('project_user')
				.set({ roles: [validated], owner: false })
				.where('user_id', '=', id)
				.where('project_id', '=', ctx.project_id)
				.execute()
			return true
		})
		this.pubSub.publish(Topic.UsersUpdated, ctx.project_id)
		return result
	}

	async getInvitations(ctx: Context) {
		return this.db
			.selectFrom('project_invitation')
			.select(invitationFields)
			.where('project_id', '=', ctx.project_id)
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.limit(100)
			.execute()
			.then(rows =>
				rows.map(row => ({
					...row,
					role: invitationRoleSchema.parse(row.role)
				}))
			)
	}

	async inviteUser(ctx: Context, data: Invite) {
		const email = invitationEmailSchema.parse(data.email)
		const role = invitationRoleSchema.parse(data.role ?? Role.Viewer)
		const token = `gri_${randomBytes(32).toString('base64url')}`
		const origin =
			process.env.APP_URL ??
			process.env.TRUSTED_ORIGINS?.split(',')[0] ??
			'http://localhost:5173'
		const url = new URL(`/invite/${token}`, origin).href
		const { invitation, projectName } = await this.db
			.transaction()
			.execute(async trx => {
				await lockProject(trx, ctx.project_id)
				await requireProjectRole(trx, ctx, [Role.Admin])
				const member = await trx
					.selectFrom('project_user')
					.innerJoin('user', 'user.id', 'project_user.user_id')
					.select('user.id')
					.where('project_id', '=', ctx.project_id)
					.where('confirmed', '=', true)
					.where('user.email', '=', email)
					.executeTakeFirst()
				if (member)
					throw new GraphQLError('This account is already a project member', {
						extensions: { code: 'BAD_USER_INPUT' }
					})
				await trx
					.updateTable('project_invitation')
					.set({ revoked_at: new Date() })
					.where('project_id', '=', ctx.project_id)
					.where('email', '=', email)
					.where('accepted_at', 'is', null)
					.where('revoked_at', 'is', null)
					.execute()
				const row = await trx
					.insertInto('project_invitation')
					.values({
						project_id: ctx.project_id,
						email,
						role,
						token_hash: hashToken(token),
						invited_by: ctx.user.id,
						invited_name: ctx.user.name,
						expires_at: new Date(Date.now() + 7 * 86400000)
					})
					.returning(invitationFields)
					.executeTakeFirstOrThrow()
				const project = await trx
					.selectFrom('project')
					.select('name')
					.where('id', '=', ctx.project_id)
					.executeTakeFirstOrThrow()
				return { invitation: { ...row, role }, projectName: project.name }
			})
		this.pubSub.publish(Topic.UsersUpdated, ctx.project_id)
		if (!process.env.EMAIL)
			return { invitation, url, emailSent: false, emailError: null }
		try {
			await this.mail.sendEmail({
				to: email,
				subject: `Invitation to ${projectName}`,
				template: { kind: 'invite', name: projectName, url }
			})
			return { invitation, url, emailSent: true, emailError: null }
		} catch {
			return {
				invitation,
				url,
				emailSent: false,
				emailError:
					'Email delivery failed. Copy the invitation link and share it with the recipient.'
			}
		}
	}

	async revokeInvitation(ctx: Context, id: number) {
		const changed = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const result = await trx
				.updateTable('project_invitation')
				.set({ revoked_at: new Date() })
				.where('id', '=', id)
				.where('project_id', '=', ctx.project_id)
				.where('accepted_at', 'is', null)
				.where('revoked_at', 'is', null)
				.executeTakeFirstOrThrow()
			return result.numUpdatedRows > 0
		})
		if (changed) this.pubSub.publish(Topic.UsersUpdated, ctx.project_id)
		return changed
	}

	async getInvitation(token: string) {
		if (!tokenSchema.safeParse(token).success) throw notFound()
		const row = await this.db
			.selectFrom('project_invitation')
			.innerJoin('project', 'project.id', 'project_invitation.project_id')
			.select([
				'project.name as project_name',
				'email',
				'role',
				'expires_at',
				'accepted_at',
				'revoked_at'
			])
			.where('token_hash', '=', hashToken(token))
			.executeTakeFirst()
		if (
			!row ||
			row.revoked_at ||
			(row.expires_at <= new Date() && !row.accepted_at)
		)
			throw notFound()
		return {
			project_name: row.project_name,
			email: row.email,
			role: roleSchema.parse(row.role),
			expires_at: row.expires_at,
			accepted: !!row.accepted_at
		}
	}

	async acceptInvitation(token: string, ctx: Context) {
		if (!tokenSchema.safeParse(token).success) throw notFound()
		const invitation = await this.db
			.selectFrom('project_invitation')
			.select('project_id')
			.where('token_hash', '=', hashToken(token))
			.executeTakeFirst()
		if (!invitation) throw notFound()
		const projectId = await this.db.transaction().execute(async trx => {
			await lockProject(trx, invitation.project_id)
			const row = await trx
				.selectFrom('project_invitation')
				.selectAll()
				.where('token_hash', '=', hashToken(token))
				.forUpdate()
				.executeTakeFirst()
			if (!row || row.revoked_at) throw notFound()
			const user = await trx
				.selectFrom('user')
				.select(['email', 'emailVerified'])
				.where('id', '=', ctx.user.id)
				.forUpdate()
				.executeTakeFirstOrThrow()
			if (invitationEmailSchema.parse(user.email) !== row.email)
				throw new GraphQLError('Sign in with the invited email address', {
					extensions: { code: 'FORBIDDEN' }
				})
			if (!user.emailVerified)
				throw new GraphQLError(
					'Verify your email before accepting this invitation',
					{ extensions: { code: 'EMAIL_NOT_VERIFIED' } }
				)
			if (row.accepted_at) {
				const stillMember = await trx
					.selectFrom('project_user')
					.select('project_id')
					.where('project_id', '=', row.project_id)
					.where('user_id', '=', ctx.user.id)
					.where('confirmed', '=', true)
					.executeTakeFirst()
				if (row.accepted_by !== ctx.user.id || !stillMember) throw notFound()
			} else {
				if (row.expires_at <= new Date()) throw notFound()
				await trx
					.insertInto('project_user')
					.values({
						project_id: row.project_id,
						user_id: ctx.user.id,
						roles: [invitationRoleSchema.parse(row.role)],
						confirmed: true,
						owner: false
					})
					.onConflict(c =>
						c.columns(['project_id', 'user_id']).doUpdateSet({
							confirmed: true,
							roles: sql`CASE WHEN project_user.confirmed THEN project_user.roles ELSE excluded.roles END`
						})
					)
					.execute()
				await trx
					.updateTable('project_invitation')
					.set({ accepted_at: new Date(), accepted_by: ctx.user.id })
					.where('id', '=', row.id)
					.execute()
			}
			await this.projects.rememberProject(trx, ctx.user.id, row.project_id)
			return row.project_id
		})
		this.pubSub.publish(Topic.UsersUpdated, projectId)
		return projectId
	}
}
