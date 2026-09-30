import { expect, test } from 'vitest'
import { loadConfig } from './config.ts'

const environment = {
	DATABASE_URL: 'postgres://groblin:test@localhost/groblin',
	BETTER_AUTH_URL: 'http://localhost:5173',
	TRUSTED_ORIGINS: 'http://localhost:5173',
	BETTER_AUTH_SECRET: 'a'.repeat(64),
	MEDIA_SIGNING_SECRET: 'b'.repeat(64),
	AWS_BUCKET: 'groblin-media',
	EMAIL: 'test@example.invalid',
	SMTP_URL: 'smtp://localhost:1025',
	BOOTSTRAP_EMAIL: 'owner@example.invalid'
}
test('startup configuration is validated and normalizes bounded defaults', () => {
	expect(loadConfig(environment)).toMatchObject({
		PORT: 6173,
		REGISTRATION_MODE: 'invite',
		HISTORY_LIMIT: 1000,
		DB_POOL_MAX: 10
	})
	for (const override of [
		{ BETTER_AUTH_SECRET: 'short' },
		{ MEDIA_SIGNING_SECRET: environment.BETTER_AUTH_SECRET },
		{ SMTP_URL: undefined },
		{ HISTORY_LIMIT: '0' },
		{ S3_ENDPOINT: 'http://minio:9000' },
		{ DATABASE_URL: 'https://example.com' },
		{ TRUSTED_ORIGINS: 'javascript:alert(1)' },
		{ BOOTSTRAP_EMAIL: undefined }
	])
		expect(() => loadConfig({ ...environment, ...override })).toThrow(
			'Invalid configuration'
		)
})
test('production requires HTTPS except for a local verification stack', () => {
	expect(() =>
		loadConfig({
			...environment,
			NODE_ENV: 'production',
			BETTER_AUTH_URL: 'http://cms.example.com'
		})
	).toThrow('HTTPS')
	expect(loadConfig({ ...environment, NODE_ENV: 'production' })).toBeDefined()
})
