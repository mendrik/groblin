import 'reflect-metadata'
import 'dotenv/config'
import { tryCatch } from 'ramda'
import { container } from './injections.ts'
import { EmailService } from './services/email-service.ts'
import { ImageService } from './services/image-service.ts'
import { InternalServer } from './services/interal-server.ts'
import { NodeSettingsService } from './services/node-settings-service.ts'
import { PublicServer } from './services/public-server.ts'

void container.get(EmailService).init()
void container.get(ImageService).init()
void container.get(NodeSettingsService).init()
void container.get(InternalServer).start()
void container.get(PublicServer).start()

const shutDown = tryCatch(() => {
	void container.get(PublicServer).stop()
	void container.get(InternalServer).stop()
}, console.error)

process.on('SIGTERM', () => {
	void shutDown()
	process.exit(0) // Exit the process gracefully
})

// You can add other signals if needed
process.on('SIGINT', () => {
	void shutDown()
	// Perform any cleanup tasks here
	process.exit(0) // Exit the process gracefully
})
