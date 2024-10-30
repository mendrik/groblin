import { darkGray } from 'ansicolor'
import { Topic, pubSub } from 'src/pubsub.ts'

async function waitForRegistration() {
	for await (const reg of pubSub.subscribe(Topic.UserRegistered)) {
		console.log(reg)
	}
}

export const initializeEmailService = async () => {
	waitForRegistration()
	console.log(darkGray('Email service initialized'))
}
