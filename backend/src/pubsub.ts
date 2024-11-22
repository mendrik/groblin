import { lightMagenta, magenta } from 'ansicolor'
import { createPubSub } from 'graphql-yoga'
import type { PubSub } from 'type-graphql'

export enum Topic {
	UserRegistered = 'userRegistered',
	NodesUpdated = 'nodesUpdated',
	ValuesUpdated = 'valuesUpdated'
}

type ProjectId = number

type PubSubTopics = {
	PROJECT_NODES: [Topic.NodesUpdated, ProjectId]
	USER_REGISTERED: [Topic.UserRegistered]
}

class LoggingPubSub implements PubSub {
	private pubSub: PubSub

	constructor() {
		this.pubSub = createPubSub<PubSubTopics>()
	}

	publish(routingKey: string, ...args: unknown[]): void {
		if (!args?.length) {
			console.log(`${magenta('Pub: ')}${lightMagenta(routingKey)}`)
		} else {
			console.log(`${magenta('Pub: ')}${lightMagenta(routingKey)}`, ...args)
		}
		this.pubSub.publish(routingKey, ...args)
	}

	subscribe(routingKey: string, dynamicId?: unknown): AsyncIterable<unknown> {
		if (dynamicId === undefined) {
			console.log(`${magenta('Sub: ')}${lightMagenta(routingKey)}`)
		} else {
			console.log(`${magenta('Sub: ')}${lightMagenta(routingKey)}`, dynamicId)
		}
		return this.pubSub.subscribe(routingKey, dynamicId)
	}
}

export const pubSub = new LoggingPubSub()
