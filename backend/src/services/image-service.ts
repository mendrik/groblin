import type { ClientRequest, ServerResponse } from 'node:http'
import type { MediaType } from '@shared/json-value-types.ts'
import { encryptInteger } from '@shared/utils/number-hash.ts'
import { url } from '@shared/utils/url.ts'
import { inject, injectable } from 'inversify'
import { isString } from 'ramda-adjunct'
import type {} from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { NodeType } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import { isJsonObject } from 'src/utils/json.ts'
import type { PubSub } from 'type-graphql'
import { S3Client } from './s3-client.ts'

const port = process.env.PUBLIC_PORT
const host = process.env.PUBLIC_HOST

@injectable()
export class ImageService {
	@inject('PubSub')
	private pubSub: PubSub

	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	@inject(S3Client)
	private s3: S3Client

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

	handleRequest(_req: ClientRequest, response: ServerResponse) {
		response.writeHead(200, { 'Content-Type': 'text/plain' })
		response.end('Hello from image service')
	}
}
