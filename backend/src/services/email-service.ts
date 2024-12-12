import { inject, injectable } from 'inversify'
import type { PubSub } from 'type-graphql'
import { Topic } from './Topic.ts'

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
