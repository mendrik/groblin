import { parseContentValue } from '@shared/content.ts'
import { parseNodeSettings } from '@shared/node-settings.ts'
import { GraphQLError } from 'graphql'
import type { NodeSettings, UpsertNodeSettings } from '../gql/schema.ts'
import { requireProjectRole } from '../security/require-role.ts'
import {
	ensureContentBaseline,
	recordContentRevision,
	requireRevision
} from '../services/content-revisions.ts'
import { validateProjectModel } from '../services/model-validation.ts'
import type { PubSub } from '../types.ts'
import { Role } from '../types.ts'

export type { NodeSettings, UpsertNodeSettings } from '../gql/schema.ts'

import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import type { Context } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import { requireNode } from '../security/project-access.ts'

@injectable()
export class NodeSettingsResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	async getNodeSettings(ctx: Context): Promise<NodeSettings[]> {
		return this.settings(ctx.project_id)
	}

	public settings(projectId: number): Promise<NodeSettings[]> {
		return this.db
			.selectFrom('node_settings')
			.where('project_id', '=', projectId)
			.selectAll()
			.execute()
			.then(rows => rows.map(row => ({ ...row, settings: row.settings ?? {} })))
	}

	async upsertNodeSettings(data: UpsertNodeSettings, ctx: Context) {
		const { project_id } = ctx
		const res = await this.db.transaction().execute(async trx => {
			await trx
				.selectFrom('project')
				.select('id')
				.where('id', '=', project_id)
				.forUpdate()
				.executeTakeFirstOrThrow()
			await requireProjectRole(trx, ctx, [Role.Admin])
			const node = await requireNode(trx, project_id, data.node_id)
			const settings = parseNodeSettings(node.type, data.settings)
			const values = await trx
				.selectFrom('values')
				.select(['id', 'value'])
				.where('node_id', '=', data.node_id)
				.where('project_id', '=', project_id)
				.execute()
			for (const value of values) {
				try {
					parseContentValue(node.type, value.value, settings)
				} catch {
					throw new GraphQLError(
						`These settings would invalidate value ${value.id}; update that value first`,
						{ extensions: { code: 'BAD_USER_INPUT' } }
					)
				}
			}
			const existing = await trx
				.selectFrom('node_settings')
				.selectAll()
				.where('node_id', '=', data.node_id)
				.where('project_id', '=', project_id)
				.executeTakeFirst()
			if (data.id != null && data.id !== existing?.id)
				throw new Error('Settings not found')
			requireRevision(
				data.expectedRevision,
				existing?.revision ?? 0,
				'Settings'
			)
			await ensureContentBaseline(trx, ctx)
			const res = await trx
				.insertInto('node_settings')
				.values({
					id: existing?.id,
					node_id: data.node_id,
					project_id,
					settings
				})
				.onConflict(c =>
					c
						.column('id')
						.doUpdateSet(e => ({
							settings: e.ref('excluded.settings')
						}))
						.where('node_settings.project_id', '=', project_id)
						.where('node_settings.node_id', '=', data.node_id)
				)
				.returningAll()
				.executeTakeFirstOrThrow()
			await validateProjectModel(trx, project_id)
			await recordContentRevision(trx, ctx, `Changed settings for ${node.name}`)
			return res
		})
		this.pubSub.publish(Topic.NodeSettingsUpdated, res)
		this.pubSub.publish(Topic.SomeNodeSettingsUpdated, project_id)
		return res
	}
}
