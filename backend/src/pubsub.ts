import { darkGray, lightCyan } from 'ansicolor'
import { createPubSub } from 'graphql-yoga'
import type { PubSub } from 'type-graphql'

type PubSubPublishArgsByKey = {
	[key: string]: [] | [any] | [number | string, any]
}

class LoggingPubSub implements PubSub {
	private pubSub: PubSub

	constructor() {
		this.pubSub = createPubSub()
	}

	publish(routingKey: string, ...args: unknown[]): void {
		console.log(`${darkGray('PubSub: ')}${lightCyan(routingKey)}`, ...args)
		this.pubSub.publish(routingKey, ...args)
	}

	subscribe(routingKey: string, dynamicId?: unknown): AsyncIterable<unknown> {
		console.log(`${darkGray('Subscribe: ')}${lightCyan(routingKey)}`, dynamicId)
		return this.pubSub.subscribe(routingKey, dynamicId)
	}
}

export const pubSub = new LoggingPubSub()
