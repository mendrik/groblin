import { describe, expect, it, vi } from 'vitest'
import { render, SesClient } from './ses-client.ts'

describe('authentication email rendering', () => {
	it('includes the verification link and escaped user name', () => {
		const html = render({
			kind: 'verify',
			name: '<Alex & Example>',
			url: 'https://example.com/verify?a=1&b=2'
		})
		expect(html).toContain('Welcome &lt;Alex &amp; Example&gt;!')
		expect(html).toContain('https://example.com/verify?a=1&amp;b=2')
	})
	it('includes the reset link and rejects unsafe schemes', () => {
		expect(
			render({ kind: 'reset', url: 'https://example.com/reset' })
		).toContain('https://example.com/reset')
		expect(() => render({ kind: 'reset', url: 'javascript:alert(1)' })).toThrow(
			'Invalid email link'
		)
	})
})

it('sends a rendered UTF-8 message and propagates delivery failures', async () => {
	const client = new SesClient()
	const send = vi.spyOn(client, 'send').mockImplementation(async () => ({}))
	const message = {
		to: 'reader@example.invalid',
		subject: 'Confirm your account',
		template: {
			kind: 'verify' as const,
			name: 'Häme',
			url: 'https://example.invalid/verify'
		}
	}
	await client.sendEmail(message)
	expect(send).toHaveBeenCalledWith(
		expect.objectContaining({
			input: expect.objectContaining({
				Destination: { ToAddresses: ['reader@example.invalid'] },
				Message: {
					Subject: { Charset: 'UTF-8', Data: message.subject },
					Body: {
						Html: { Charset: 'UTF-8', Data: expect.stringContaining('Häme') }
					}
				}
			})
		})
	)
	send.mockRejectedValueOnce(new Error('Mail delivery failed'))
	await expect(client.sendEmail(message)).rejects.toThrow(
		'Mail delivery failed'
	)
	client.destroy()
})
