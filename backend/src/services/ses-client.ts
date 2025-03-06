import { SESClient as AWSClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { caseOf, match } from '@shared/utils/match.ts'
import { replacePlaceholders } from '@shared/utils/strings.ts'
import { traverse } from '@shared/utils/traverse.ts'
import { renderToStaticMarkup } from '@usewaypoint/email-builder'
import { injectable } from 'inversify'
import { T as _, both, identity, includes } from 'ramda'
import { isString } from 'ramda-adjunct'

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
		const template = await import(`../../emails/${file}`)
		const withOptions = traverse(
			match<[any, string | undefined], any>(
				caseOf([isString, _], s =>
					replacePlaceholders(options)(s)
				),
				caseOf([_, _], identity)
			),
			template
		)
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
						Data: renderToStaticMarkup(withOptions, { rootBlockId: 'root' })
					}
				}
			},
			Source: process.env.EMAIL
		})
		return this.send(email).then()
	}
}
