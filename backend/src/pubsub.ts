import { lightMagenta, magenta } from 'ansicolor'
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
		if (!args?.length) {
			console.log(`${magenta('PubSub: ')}${lightMagenta(routingKey)}`)
		} else {
			console.log(`${magenta('PubSub: ')}${lightMagenta(routingKey)}`, ...args)
		}
		this.pubSub.publish(routingKey, ...args)
	}

	subscribe(routingKey: string, dynamicId?: unknown): AsyncIterable<unknown> {
		if (dynamicId === undefined) {
			console.log(`${magenta('Subscribe: ')}${lightMagenta(routingKey)}`)
		} else {
			console.log(
				`${magenta('Subscribe: ')}${lightMagenta(routingKey)}`,
				dynamicId
			)
		}
		return this.pubSub.subscribe(routingKey, dynamicId)
	}
}

export const pubSub = new LoggingPubSub()
