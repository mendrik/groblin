import { SESClient as AWSClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { caseOf, match } from '@shared/utils/match.ts'
import { replacePlaceholders } from '@shared/utils/strings.ts'
import { traverse } from '@shared/utils/traverse.ts'
import { renderToStaticMarkup } from '@usewaypoint/email-builder'
import { injectable } from 'inversify'
import { T as _, identity } from 'ramda'
import { isString } from 'ramda-adjunct'

type SendEmail = {
	file: string
	to: string
	subject: string
	options?: Record<string, any>
}

export const render = async (
	file: string,
	options: Record<string, any>
): Promise<string> => {
	const template = await import(file)
	const withOptions = traverse(
		match<[unknown, string | undefined], any>(
			caseOf([isString, _], replacePlaceholders(options)),
			caseOf([_, _], identity)
		),
		template
	)
	return renderToStaticMarkup(withOptions, { rootBlockId: 'root' })
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
		const body = await render(`../../emails/${file}`, options)
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
						Data: body
					}
				}
			},
			Source: process.env.EMAIL
		})
		return this.send(email).then()
	}
}
