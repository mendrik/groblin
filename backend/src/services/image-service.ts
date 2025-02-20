import type { IncomingMessage, ServerResponse } from 'node:http'
import { assertExists, assertThat } from '@shared/asserts.ts'
import type { MediaType } from '@shared/json-value-types.ts'
import {} from '@shared/utils/match.ts'
import { decryptInteger, encryptInteger } from '@shared/utils/number-hash.ts'
import { url } from '@shared/utils/url.ts'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { uniq } from 'ramda'
import { included, isString } from 'ramda-adjunct'
import type { DB } from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { NodeType } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import { isJsonObject } from 'src/utils/json.ts'
import type { PubSub } from 'type-graphql'
import { S3Client } from './s3-client.ts'

const port = process.env.PUBLIC_PORT
const host = process.env.PUBLIC_HOST

type ValueWithSettings = {
	value: MediaType
	settings?: {
		thumbnails: string[]
		required: boolean
	}
}

@injectable()
export class ImageService {
	@inject('PubSub')
	private pubSub: PubSub

	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	@inject(S3Client)
	private s3: S3Client

	@inject(Kysely)
	private db: Kysely<DB>

	init() {
		void this.waitForImageReplacement()
	}

	async waitForImageReplacement() {
		console.log('Waiting for image replacement')
		for await (const value of this.pubSub.subscribe(
			Topic.ValueReplaced
		) as AsyncIterable<Value>) {
			const node = await this.nodeResolver.getNode(value.node_id)
			if (
				node.type === NodeType.media &&
				isJsonObject(value.value) &&
				isString(value.value.file)
			) {
				this.s3.deleteFile(value.value.file)
			}
		}
	}

	imageUrl(value: Value & { value: MediaType }, size?: string): string {
		return url`http://${host}:${port}/image/${encryptInteger(value.id)}?size=${size}`
	}

	async handleRequest<I extends IncomingMessage, O extends ServerResponse<I>>(
		req: I,
		response: O
	) {
		assertExists(req.url, 'Request URL is missing')
		const url = new URL(req.url, `http://${host}:${port}`)
		const size = url.searchParams.get('size')
		const idHash = url.pathname.split('/').pop()
		assertExists(idHash, 'Image ID is missing')
		const id = decryptInteger(idHash)

		const res = await this.db
			.selectFrom('values')
			.leftJoin('node_settings', 'values.node_id', 'node_settings.node_id')
			.select([
				'values.value',
				eb => eb.ref('node_settings.settings').as('settings')
			])
			.where('values.id', '=', id)
			.executeTakeFirstOrThrow()
		const settings = res as ValueWithSettings
		const thumbails: string[] = uniq(
			['640'].concat(settings.settings?.thumbnails ?? [])
		)
		if (size) {
			assertThat(included(thumbails), size, 'Invalid size')
		}
		response.writeHead(200, { 'Content-Type': 'text/plain' })
		response.end(JSON.stringify(thumbails))
	}
}
