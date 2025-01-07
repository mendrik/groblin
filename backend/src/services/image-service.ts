import { inject, injectable } from 'inversify'
import type { Value } from 'src/resolvers/value-resolver.ts'
import {} from 'src/types.ts'
import type { PubSub } from 'type-graphql'
import { Topic } from './Topic.ts'

@injectable()
export class ImageService {
	@inject('PubSub')
	private pubSub: PubSub

	constructor() {
		this.pubSub.subscribe(Topic.ValuesUpdated, this.createThumbnails.bind(this))
	}

	async createThumbnails(value: Value): Promise<void> {
		console.log(value)
	}
}
