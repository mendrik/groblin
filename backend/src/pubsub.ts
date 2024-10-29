import { darkGray, lightCyan } from 'ansicolor'
import { type PubSub, createPubSub } from 'graphql-yoga'

class LoggingPubSub {
	private pubSub: PubSub<any>

	constructor() {
		this.pubSub = createPubSub()
	}

	publish<T>(message: string, payload: T): void {
		console.log(`${darkGray('PubSub: ')}${lightCyan(message)}`, payload)
		this.pubSub.publish(message, payload)
	}

	subscribe<T>(message: string, callback: (payload: T) => void): () => void {
		return this.pubSub.subscribe()
	}
}

// Create an instance of LoggingPubSub
export const pubSub = new LoggingPubSub()
