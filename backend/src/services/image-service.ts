import type { ClientRequest, ServerResponse } from 'node:http'
import type {} from 'fastify'
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

	handleRequest(_req: ClientRequest, response: ServerResponse) {
		response.writeHead(200,{"Content-Type":"text/plain"});
		response.end('Hello from image service')
	}
}
