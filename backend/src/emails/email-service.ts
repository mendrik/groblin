import { inject, injectable } from 'inversify'
import { LoggingPubSub, Topic } from 'src/pubsub.ts'

@injectable()
export class EmailService {
	@inject(LoggingPubSub)
	pubSub: LoggingPubSub

	async waitForRegistration() {
		for await (const reg of this.pubSub.subscribe(Topic.UserRegistered)) {
			console.log(reg)
		}
	}
}
