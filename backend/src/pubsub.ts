import { cyan, lightGray, lightMagenta } from 'ansicolor'
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
		console.log(`${lightMagenta('PubSub: ')}${lightGray(routingKey)}`, ...args)
		this.pubSub.publish(routingKey, ...args)
	}

	subscribe(routingKey: string, dynamicId?: unknown): AsyncIterable<unknown> {
		console.log(`${lightMagenta('Subscribe: ')}${cyan(routingKey)}`, dynamicId)
		return this.pubSub.subscribe(routingKey, dynamicId)
	}
}

export const pubSub = new LoggingPubSub()
