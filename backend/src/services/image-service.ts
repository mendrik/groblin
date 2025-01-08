import { inject, injectable } from 'inversify'
import { isObject, isString } from 'ramda-adjunct'
import type { JsonObject, JsonValue } from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { NodeType } from 'src/types.ts'
import type { PubSub } from 'type-graphql'
import { Topic } from './Topic.ts'
import { S3Client } from './s3-client.ts'

const isJsonObject: (json: JsonValue) => json is JsonObject = isObject

@injectable()
export class ImageService {
	@inject('PubSub')
	private pubSub: PubSub

	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	@inject(S3Client)
	private s3: S3Client

	async waitForImageUpload() {
		console.log('Waiting for image upload')
		for await (const value of this.pubSub.subscribe(
			Topic.ValueReplaced
		) as AsyncIterable<Value>) {
			const node = await this.nodeResolver.getNode(value.node_id)
			if (
				node.type === NodeType.media &&
				isJsonObject(value.value) &&
				isString(value.value.file)
			) {
				console.log('Deleting image', value.value.file, value.value.name)
				this.s3.deleteFile(value.value.file)
			}
		}
	}
}
