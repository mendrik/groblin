import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB, NodeSettings } from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import { NodeType } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import { isJsonObject } from 'src/utils/json.ts'
import type { PubSub } from 'type-graphql'

@injectable()
export class NodeSettingsService {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	init() {
		void this.waitForChoiceChanges()
	}

	// delete invalid selections
	async waitForChoiceChanges() {
		for await (const setting of this.pubSub.subscribe(
			Topic.NodeSettingsUpdated
		) as AsyncIterable<NodeSettings>) {
			const node = await this.nodeResolver.getNode(setting.node_id)
			if (node.type === NodeType.choice && isJsonObject(setting.settings)) {
				const choices = (setting.settings?.choices ?? []) as string[]
				const res = await this.db
					.deleteFrom('values as v')
					.where('node_id', '=', setting.node_id)
					.where(sql`COALESCE(v.value ->> 'selected', null)`, 'not in', choices)
					.execute()

				if (res.length > 0) {
					this.pubSub.publish(Topic.ValuesUpdated, true)
				}
			}
		}
	}
}
