import { SESClient as AWSClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { injectable } from 'inversify'
import { createTransport } from 'nodemailer'

type EmailTemplate =
	| { kind: 'verify'; name: string; url: string }
	| { kind: 'reset'; url: string }
	| { kind: 'invite'; name: string; url: string }
type SendEmail = { template: EmailTemplate; to: string; subject: string }

const escapeHtml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		character =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
				character
			] ?? character
	)

export const render = (template: EmailTemplate): string => {
	const reset = template.kind === 'reset'
	const link = new URL(template.url)
	if (!['http:', 'https:'].includes(link.protocol))
		throw new Error('Invalid email link')
	const title =
		template.kind === 'verify'
			? `Welcome ${template.name}!`
			: template.kind === 'invite'
				? `Invitation to ${template.name}`
				: 'Reset your password'
	const description = reset
		? 'Use the link below to reset your password. If you did not request this, ignore this email.'
		: template.kind === 'invite'
			? 'Sign in or register with this email address, verify it, then accept the invitation. This link expires in seven days.'
			: 'Please verify your email address.'
	return `<html><body><h1>${escapeHtml(title)}</h1><p>${description}</p><p><a href="${escapeHtml(link.href)}">${reset ? 'Reset password' : template.kind === 'invite' ? 'Accept invitation' : 'Verify email'}</a></p></body></html>`
}

@injectable()
export class SesClient extends AWSClient {
	constructor() {
		super({ region: process.env.AWS_REGION })
	}

	async sendEmail({ template, to, subject }: SendEmail): Promise<void> {
		const body = render(template)
		if (process.env.EMAIL_TRANSPORT === 'smtp') {
			if (!process.env.SMTP_URL) throw new Error('SMTP_URL is required')
			const transport = createTransport({
				url: process.env.SMTP_URL,
				connectionTimeout: 10000,
				greetingTimeout: 10000,
				socketTimeout: 15000,
				disableFileAccess: true,
				disableUrlAccess: true
			})
			try {
				await transport.sendMail({
					from: process.env.EMAIL,
					to,
					subject,
					html: body
				})
			} finally {
				transport.close()
			}
			return
		}
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
