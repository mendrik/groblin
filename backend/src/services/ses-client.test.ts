import { describe, expect, it } from 'vitest'
import { render } from './ses-client.ts'

describe('replacePlaceholders', () => {
	it('should work with email json', async () => {
		const template = await render('../../emails/confirmAccount.json', {
			user: { name: 'Andreas Herd' },
			url: 'https://example.com'
		})
		expect(template).toContain('Welcome Andreas Herd!')
		expect(template).toContain('https://example.com')
	})
})
