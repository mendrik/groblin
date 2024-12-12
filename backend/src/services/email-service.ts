import { inject, injectable } from 'inversify'
import { Topic } from 'src/services/pubsub-service.ts'
import type { PubSub } from 'type-graphql'

@injectable()
export class EmailService {
	@inject('PubSub')
	private pubSub: PubSub

	async waitForRegistration() {
		for await (const reg of this.pubSub.subscribe(Topic.UserRegistered)) {
			console.log(reg)
		}
	}
}
