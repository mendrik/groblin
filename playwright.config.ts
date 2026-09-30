import { defineConfig } from '@playwright/test'
export default defineConfig({
	testDir: './e2e',
	timeout: 120000,
	workers: 1,
	reporter: [
		['list'],
		[
			'html',
			{
				outputFolder: `.release/browser-report/${process.env.E2E_PHASE ?? 'latest'}`,
				open: 'never'
			}
		]
	],
	use: {
		actionTimeout: 15000,
		navigationTimeout: 15000,
		baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8088',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		viewport: { width: 1440, height: 1000 }
	},
	outputDir: `.release/browser-results/${process.env.E2E_PHASE ?? 'latest'}`
})
