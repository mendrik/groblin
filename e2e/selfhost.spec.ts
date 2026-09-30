import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import { z } from 'zod'

const owner = process.env.E2E_OWNER_EMAIL ?? 'owner@example.invalid'
const editor = 'editor@example.invalid'
const password = 'synthetic browser password 123'
const mailUrl = process.env.E2E_MAIL_URL ?? 'http://localhost:8028'
const messagesSchema = z.object({
	messages: z.array(
		z.object({
			ID: z.string(),
			Subject: z.string(),
			To: z.array(z.object({ Address: z.string() }))
		})
	)
})
async function verifyEmail(page: Page, email: string) {
	let id: string | undefined
	await expect
		.poll(async () => {
			const messages = messagesSchema.parse(
				await (await page.request.get(`${mailUrl}/api/v1/messages`)).json()
			)
			id = messages.messages.find(
				message =>
					message.Subject === 'Verify your email' &&
					message.To.some(to => to.Address === email)
			)?.ID
			return id
		})
		.toBeTruthy()
	const message = z
		.object({ HTML: z.string() })
		.parse(
			await (await page.request.get(`${mailUrl}/api/v1/message/${id}`)).json()
		)
	const match = message.HTML.match(/href="([^"]+)"/)
	if (!match?.[1]) throw new Error('Missing verification link')
	await page.goto(match[1].replaceAll('&amp;', '&'))
}
async function register(page: Page, email: string, name: string) {
	await page.goto('/register')
	await page.getByLabel('Name', { exact: true }).fill(name)
	await page.getByLabel('Email', { exact: true }).fill(email)
	await page.getByLabel('Password', { exact: true }).fill(password)
	await page.getByLabel('Repeat password').fill(password)
	await page.getByRole('button', { name: 'Register', exact: true }).click()
	await expect(
		page.getByText('Successfully registered', { exact: true })
	).toBeVisible()
	await verifyEmail(page, email)
}
async function login(page: Page, email: string) {
	await page.goto('/')
	if (
		await page.getByRole('button', { name: 'Login', exact: true }).isVisible()
	) {
		await page.getByLabel('Email', { exact: true }).fill(email)
		await page.getByLabel('Password', { exact: true }).fill(password)
		await page.getByRole('button', { name: 'Login', exact: true }).click()
	}
	await expect(
		page.getByRole('button', { name: 'All changes saved' })
	).toBeVisible()
}
async function createField(
	page: Page,
	name: string,
	type: string,
	existing?: string
) {
	if (existing) {
		await page.getByRole('button', { name: `Actions for ${existing}` }).click()
		await page.getByRole('menuitem', { name: 'Insert below…' }).click()
	} else await page.getByRole('button', { name: 'Add node…' }).click()
	const dialog = page.getByRole('dialog')
	await dialog.getByLabel('Name', { exact: true }).fill(name)
	await dialog.getByRole('combobox').click()
	await page.getByRole('option', { name: type, exact: true }).click()
	await dialog.getByRole('button', { name: 'Create', exact: true }).click()
	await expect(dialog).toBeHidden()
	await page.getByRole('button', { name, exact: true }).click()
}
async function saveTitle(page: Page, text: string) {
	await page.getByRole('button', { name: 'Title', exact: true }).click()
	await page.locator('input.field-sizing').fill(text)
	await page.getByRole('button', { name: 'Title', exact: true }).click()
	await expect(
		page.getByRole('button', { name: 'All changes saved' })
	).toBeVisible()
}
test('a new operator models content, invites an editor, publishes to a website and restores a mistake', async ({
	page,
	browser
}) => {
	const response = await page.request.get('/health/ready')
	expect(response.ok()).toBe(true)
	expect(response.headers()['x-request-id']).toBeTruthy()
	await page.goto('/')
	await expect(
		page.getByRole('link', { name: 'Read the first-project guide' })
	).toHaveAttribute('href', '/guide')
	await page.getByRole('link', { name: 'Read the first-project guide' }).click()
	await expect(page).toHaveURL(/\/guide$/)
	const denied = await page.request.post('/api/auth/sign-up/email', {
		headers: { origin: new URL(page.url()).origin },
		data: {
			name: 'Uninvited account',
			email: 'uninvited@example.invalid',
			password
		}
	})
	expect(denied.ok()).toBe(false)
	await register(page, owner, 'Release Owner')
	await login(page, owner)
	await createField(page, 'Title', 'String')
	await saveTitle(page, 'Hello from Groblin')
	await createField(page, 'Download', 'Media', 'Title')
	await page.getByLabel('Upload Download').setInputFiles({
		name: 'release.txt',
		mimeType: 'text/plain',
		buffer: Buffer.from('Self hosted media round trip')
	})
	await expect(
		page.getByTestId('values').getByText('release.txt', { exact: true })
	).toBeVisible()
	await expect(
		page.getByRole('button', { name: 'All changes saved' })
	).toBeVisible()
	await page.getByRole('button', { name: 'Users', exact: true }).click()
	await page.getByRole('button', { name: 'Invite member…' }).click()
	await page
		.getByRole('dialog')
		.getByLabel('Email', { exact: true })
		.fill(editor)
	await page.getByRole('button', { name: 'Create invitation' }).click()
	const invitation = await page.getByLabel('Invitation link').inputValue()
	await page.getByRole('button', { name: 'Done', exact: true }).click()
	const editorContext = await browser.newContext()
	const editorPage = await editorContext.newPage()
	await editorPage.goto(invitation)
	await register(editorPage, editor, 'Release Editor')
	await login(editorPage, editor)
	await editorPage.goto(invitation)
	await editorPage
		.getByRole('button', { name: 'Accept invitation', exact: true })
		.click()
	await expect(
		editorPage.getByRole('button', { name: 'Title', exact: true })
	).toBeVisible()
	await expect(
		editorPage.getByRole('button', { name: 'Users', exact: true })
	).toHaveCount(0)
	await expect(
		editorPage.getByRole('button', { name: 'Api keys', exact: true })
	).toHaveCount(0)
	await saveTitle(editorPage, 'Edited by the invited editor')
	await page.getByRole('button', { name: 'Publication', exact: true }).click()
	await page
		.getByRole('button', { name: 'Review draft for publication' })
		.click()
	await page.getByRole('button', { name: 'Continue', exact: true }).click()
	await page.getByRole('button', { name: 'Confirm publication' }).click()
	await expect(page.getByText(/Published version/)).toBeVisible()
	await page.getByRole('button', { name: 'Api keys', exact: true }).click()
	await page
		.getByRole('button', { name: 'Create new api key', exact: true })
		.click()
	await page
		.getByRole('dialog')
		.getByLabel('Name', { exact: true })
		.fill('Release consumer')
	await page
		.getByRole('dialog')
		.getByRole('button', { name: 'Create', exact: true })
		.click()
	const key = await page
		.getByRole('textbox', { name: 'New API key', exact: true })
		.inputValue()
	await page.getByRole('button', { name: 'Done', exact: true }).click()
	const result = z
		.object({
			data: z.object({
				Title: z.string(),
				Download: z.object({ url: z.string() })
			})
		})
		.parse(
			await (
				await page.request.post('/content/graphql', {
					headers: { 'x-api-key': key },
					data: { query: 'query { Title Download { url } }' }
				})
			).json()
		)
	if (process.env.E2E_FIXTURE_PATH)
		await writeFile(
			process.env.E2E_FIXTURE_PATH,
			JSON.stringify({
				key,
				mediaUrl: result.data.Download.url,
				title: result.data.Title,
				owner,
				password
			}),
			{ mode: 0o600 }
		)
	expect(result.data.Title).toBe('Edited by the invited editor')
	expect(await (await page.request.get(result.data.Download.url)).text()).toBe(
		'Self hosted media round trip'
	)
	const consumer = spawn(
		process.execPath,
		[resolve('examples/consumer/server.mjs')],
		{
			env: {
				...process.env,
				GROBLIN_URL: 'http://localhost:8088',
				GROBLIN_API_KEY: key,
				PORT: '8089'
			},
			stdio: 'ignore'
		}
	)
	try {
		await expect
			.poll(async () => {
				try {
					return (await page.request.get('http://localhost:8089')).status()
				} catch {
					return 0
				}
			})
			.toBe(200)
		const website = await editorContext.newPage()
		await website.goto('http://localhost:8089')
		await expect(website.getByRole('heading', { level: 1 })).toHaveText(
			'Edited by the invited editor'
		)
		await saveTitle(editorPage, 'A draft mistake')
		await website.reload()
		await expect(website.getByRole('heading', { level: 1 })).toHaveText(
			'Edited by the invited editor'
		)
		await page
			.getByRole('button', { name: 'Content history', exact: true })
			.click()
		const history = page.getByRole('dialog')
		await history
			.getByRole('button', { name: /Changed Title/ })
			.nth(1)
			.click()
		await history.getByRole('button', { name: 'Restore this version' }).click()
		await history.getByRole('button', { name: 'Confirm restore' }).click()
		await expect(history).toBeHidden()
		await page.getByRole('button', { name: 'Home', exact: true }).click()
		await expect(page.locator('input.field-sizing')).toHaveValue(
			'Edited by the invited editor'
		)
	} finally {
		consumer.kill('SIGTERM')
		await editorContext.close()
	}
})
