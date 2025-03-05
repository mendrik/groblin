import { SESClient as AWSClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { renderToStaticMarkup } from '@usewaypoint/email-builder'
import { injectable } from 'inversify'

type SendEmail = {
	file: string
	to: string
	subject: string
	options?: Record<string, any>
}

@injectable()
export class SesClient extends AWSClient {
	constructor() {
		super({ region: process.env.AWS_REGION })
	}

	async sendEmail({
		file,
		to,
		subject,
		options = {}
	}: SendEmail): Promise<void> {
		const template = await import(file)
		const email = new SendEmailCommand({
			Destination: {
				ToAddresses: [to]
			},
			Message: {
				Subject: {
					Charset: 'UTF-8',
					Data: subject
				},
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: renderToStaticMarkup(template, {
							rootBlockId: 'root',
							...options
						})
					}
				}
			},
			Source: process.env.EMAIL
		})
		return this.send(email).then()
	}
}
