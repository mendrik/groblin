import { inject, injectable } from 'inversify'
import type { PubSub } from 'type-graphql'
import { Topic } from './Topic.ts'

@injectable()
export class EmailService {
	@inject('PubSub')
	private pubSub: PubSub

	async init() {
		void this.waitForUserRegistered()
	}

	async waitForUserRegistered() {
		console.log('Waiting for registration')
		for await (const reg of this.pubSub.subscribe(Topic.UserRegistered)) {
			console.log(reg)
		}
	}
}
