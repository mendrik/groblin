import { readFile } from 'node:fs/promises'
import { expect, type Page } from '@playwright/test'
import { z } from 'zod'

export async function releaseFixture() {
	const path = process.env.E2E_FIXTURE_PATH
	if (!path) throw new Error('Run selfhost.spec.ts with E2E_FIXTURE_PATH first')
	return z
		.object({
			key: z.string(),
			mediaUrl: z.string().url(),
			title: z.string(),
			owner: z.string().email(),
			password: z.string()
		})
		.parse(JSON.parse(await readFile(path, 'utf8')))
}

export async function signIn(page: Page, email: string, password: string) {
	await page.goto('/')
	await page.getByLabel('Email', { exact: true }).fill(email)
	await page.getByLabel('Password', { exact: true }).fill(password)
	const submit = async () => {
		const response = page.waitForResponse(response =>
			response.url().includes('/api/auth/sign-in/email')
		)
		await page.getByRole('button', { name: 'Login', exact: true }).click()
		return response
	}
	const response = await submit()
	if (response.status() === 429) {
		// Retain the production auth throttle and respect its Retry-After response.
		const seconds = Number(response.headers()['retry-after'] ?? 10)
		await page.waitForTimeout(Math.min(60, Math.max(1, seconds)) * 1000)
		expect((await submit()).ok()).toBe(true)
	} else expect(response.ok()).toBe(true)
	await expect(
		page.getByRole('button', { name: 'All changes saved' })
	).toBeVisible()
}

export async function titleInput(page: Page) {
	await page.getByRole('button', { name: 'Home', exact: true }).click()
	await page.getByRole('button', { name: 'Title', exact: true }).click()
	return page.getByRole('textbox', { name: 'Title', exact: true })
}

export async function changeTitle(page: Page, title: string) {
	await (await titleInput(page)).fill(title)
	await page.getByRole('button', { name: 'Title', exact: true }).click()
	await expect(
		page.getByRole('button', { name: 'All changes saved' })
	).toBeVisible()
}

export const publishedContent = z.object({
	data: z.object({
		Title: z.string(),
		Download: z.object({ url: z.string().url() })
	})
})
