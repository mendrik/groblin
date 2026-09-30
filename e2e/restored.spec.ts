import { expect, test } from '@playwright/test'
import { publishedContent, releaseFixture, signIn, titleInput } from './support'

test('a restored deployment preserves accounts, members, keys, publications, media and revision history', async ({
	page
}) => {
	test.skip(
		!process.env.E2E_FIXTURE_PATH,
		'Requires a restored release fixture'
	)
	const fixture = await releaseFixture()
	expect((await page.request.get('/health/ready')).ok()).toBe(true)
	expect((await page.request.get('/health/live')).ok()).toBe(true)
	const publication = publishedContent.parse(
		await (
			await page.request.post('/content/graphql', {
				headers: { 'x-api-key': fixture.key },
				data: { query: 'query { Title Download { url } }' }
			})
		).json()
	)
	expect(publication.data.Title).toBe(fixture.title)
	expect(
		await (await page.request.get(publication.data.Download.url)).text()
	).toBe('Self hosted media round trip')
	// A URL issued before the backup must still work after restoring the signing secret and history.
	expect(await (await page.request.get(fixture.mediaUrl)).text()).toBe(
		'Self hosted media round trip'
	)
	expect(
		(
			await page.request.get('/content/schema', {
				headers: { 'x-api-key': fixture.key }
			})
		).ok()
	).toBe(true)
	expect((await page.request.get('/content/schema')).status()).toBe(403)
	expect(
		(
			await page.request.post('/content/graphql', { data: 'x'.repeat(65537) })
		).status()
	).toBe(413)
	await signIn(page, fixture.owner, fixture.password)
	await expect(await titleInput(page)).toHaveValue(fixture.title)
	await page.getByRole('button', { name: 'Users', exact: true }).click()
	await expect(
		page.getByRole('combobox', { name: 'Role for Release Editor' })
	).toHaveValue('Editor')
	await page
		.getByRole('button', { name: 'Content history', exact: true })
		.click()
	await expect(
		page.getByRole('dialog').getByRole('button', { name: /Restored version/ })
	).toBeVisible()
	await expect(
		page
			.getByRole('dialog')
			.getByRole('button', { name: /Changed Title/ })
			.first()
	).toBeVisible()
})
