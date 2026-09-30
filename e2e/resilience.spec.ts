import { expect, test } from '@playwright/test'
import { changeTitle, releaseFixture, signIn, titleInput } from './support'

test.beforeEach(() => {
	test.skip(
		!process.env.E2E_FIXTURE_PATH,
		'Requires a populated release fixture'
	)
})

test('two browser tabs detect concurrent edits and require an explicit resolution', async ({
	page,
	context
}) => {
	const fixture = await releaseFixture()
	await signIn(page, fixture.owner, fixture.password)
	const second = await context.newPage()
	await second.goto('/')
	await expect(await titleInput(second)).toHaveValue(fixture.title)
	await (await titleInput(page)).fill('My concurrent edit')
	await changeTitle(second, 'The other tab saved first')
	await page.getByRole('button', { name: 'Title', exact: true }).click()
	await page.getByRole('button', { name: 'Conflict needs review' }).click()
	const dialog = page.getByRole('dialog')
	await expect(
		dialog.getByText('My concurrent edit', { exact: false })
	).toBeVisible()
	await dialog.getByRole('button', { name: 'Review latest' }).click()
	await expect(
		dialog.getByText('The other tab saved first', { exact: false })
	).toBeVisible()
	await dialog.getByRole('button', { name: 'Use saved version' }).click()
	await dialog.getByRole('button', { name: 'Close', exact: true }).click()
	await expect(await titleInput(page)).toHaveValue('The other tab saved first')
	await changeTitle(page, fixture.title)
})

test('a disconnected save survives reload and is retried only after review', async ({
	page
}) => {
	const fixture = await releaseFixture()
	let disconnected = false
	await page.routeWebSocket('**/graphql', socket => {
		const server = socket.connectToServer()
		// Drop outbound frames during the outage, leaving real server responses untouched.
		socket.onMessage(message => {
			if (!disconnected) server.send(message)
		})
	})
	await signIn(page, fixture.owner, fixture.password)
	const input = await titleInput(page)
	disconnected = true
	await input.fill('Recovered after disconnection')
	await page.getByRole('button', { name: 'Title', exact: true }).click()
	await expect(page.getByRole('button', { name: 'Saving…' })).toBeVisible()
	page.on('dialog', dialog => dialog.accept())
	disconnected = false
	await page.reload()
	await page.getByRole('button', { name: 'Save failed', exact: true }).click()
	const dialog = page.getByRole('dialog')
	await expect(
		dialog.getByText('Recovered an unconfirmed edit. Review or retry it.')
	).toBeVisible()
	await expect(
		dialog.getByText('Recovered after disconnection', { exact: false })
	).toBeVisible()
	await dialog.getByRole('button', { name: 'Review latest' }).click()
	await expect(dialog.getByText(fixture.title, { exact: false })).toBeVisible()
	await dialog.getByRole('button', { name: 'Save my edit' }).click()
	await expect(
		dialog.getByText('All changes saved.', { exact: true })
	).toBeVisible()
	await dialog.getByRole('button', { name: 'Close', exact: true }).click()
	await expect(await titleInput(page)).toHaveValue(
		'Recovered after disconnection'
	)
	await changeTitle(page, fixture.title)
})

test('project selection in another tab does not retarget a save and revoked editor privileges update immediately', async ({
	page,
	context,
	browser
}) => {
	const fixture = await releaseFixture()
	await signIn(page, fixture.owner, fixture.password)
	await titleInput(page)
	const second = await context.newPage()
	await second.goto('/projects')
	await second
		.getByRole('textbox', { name: 'New project name' })
		.fill('Release isolated project')
	await second
		.getByRole('button', { name: 'Create project', exact: true })
		.click()
	await expect(second.getByRole('button', { name: 'Add node…' })).toBeVisible()
	await changeTitle(page, 'Saved in the original tab project')
	await expect(
		second.getByRole('button', { name: 'Title', exact: true })
	).toHaveCount(0)
	await second.reload()
	await expect(
		second.getByRole('button', { name: 'Title', exact: true })
	).toHaveCount(0)
	await changeTitle(page, fixture.title)
	// Delete only the synthetic empty project created by this test.
	await second.getByRole('button', { name: 'Projects', exact: true }).click()
	await second.getByRole('button', { name: 'Review deletion' }).click()
	await second
		.getByLabel('Type Release isolated project to confirm')
		.fill('Release isolated project')
	await second.getByRole('button', { name: 'Confirm deletion' }).click()
	await expect(
		second.getByText('Release isolated project · Owner')
	).toHaveCount(0)
	const editorContext = await browser.newContext()
	try {
		const editor = await editorContext.newPage()
		await signIn(editor, 'editor@example.invalid', fixture.password)
		await titleInput(editor)
		await page.getByRole('button', { name: 'Users', exact: true }).click()
		await page
			.getByRole('combobox', { name: 'Role for Release Editor' })
			.selectOption('Viewer')
		await expect(
			page.getByRole('combobox', { name: 'Role for Release Editor' })
		).toHaveValue('Viewer')
		await expect(
			editor.getByRole('textbox', { name: 'Title', exact: true })
		).toHaveCount(0)
		await expect(
			editor.getByTestId('values').getByText(fixture.title, { exact: true })
		).toBeVisible()
		await expect(
			editor.getByRole('button', { name: 'Actions for Title' })
		).toHaveCount(0)
		await page
			.getByRole('combobox', { name: 'Role for Release Editor' })
			.selectOption('Editor')
		await expect(
			editor.getByRole('textbox', { name: 'Title', exact: true })
		).toBeVisible()
	} finally {
		await editorContext.close()
	}
})
