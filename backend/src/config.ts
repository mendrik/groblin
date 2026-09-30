import { z } from 'zod'

const port = (fallback: number) =>
	z.coerce.number().int().min(1).max(65535).default(fallback)
const secret = z
	.string()
	.min(32)
	.refine(
		value => !/CHANGE_ME|REPLACE_WITH/i.test(value),
		'Generate a unique secret'
	)
const httpUrl = z
	.url()
	.refine(
		value => ['http:', 'https:'].includes(new URL(value).protocol),
		'Use an HTTP or HTTPS URL'
	)
const flag = z.enum(['true', 'false']).default('false')
export const configSchema = z
	.object({
		NODE_ENV: z
			.enum(['development', 'production', 'test'])
			.default('development'),
		PORT: port(6173),
		PUBLIC_PORT: port(4001),
		DATABASE_URL: z
			.url()
			.refine(
				value => ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
				'Use a PostgreSQL URL'
			),
		BETTER_AUTH_URL: httpUrl,
		TRUSTED_ORIGINS: z
			.string()
			.min(1)
			.transform(value => value.split(',').map(origin => origin.trim()))
			.pipe(z.array(httpUrl)),
		BETTER_AUTH_SECRET: secret,
		MEDIA_SIGNING_SECRET: secret,
		AWS_REGION: z.string().min(1).default('us-east-1'),
		AWS_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
		S3_ENDPOINT: httpUrl.optional(),
		S3_PUBLIC_ENDPOINT: httpUrl.optional(),
		S3_FORCE_PATH_STYLE: flag,
		AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
		AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		EMAIL_TRANSPORT: z.enum(['smtp', 'ses']).default('smtp'),
		SMTP_URL: z
			.url()
			.refine(
				value => ['smtp:', 'smtps:'].includes(new URL(value).protocol),
				'Use an SMTP URL'
			)
			.optional(),
		EMAIL: z.email(),
		REGISTRATION_MODE: z.enum(['invite', 'open', 'closed']).default('invite'),
		BOOTSTRAP_EMAIL: z.email().optional(),
		THUMB_QUALITY: z.coerce.number().int().min(1).max(100).default(80),
		MAX_PROJECT_FIELDS: z.coerce
			.number()
			.int()
			.min(10)
			.max(10000)
			.default(2000),
		DB_POOL_MAX: z.coerce.number().int().min(2).max(100).default(10),
		HISTORY_DAYS: z.coerce.number().int().min(1).max(3650).default(30),
		HISTORY_LIMIT: z.coerce.number().int().min(10).max(10000).default(1000),
		PUBLICATION_LIMIT: z.coerce.number().int().min(1).max(1000).default(100),
		SHUTDOWN_TIMEOUT_MS: z.coerce
			.number()
			.int()
			.min(1000)
			.max(120000)
			.default(30000)
	})
	.superRefine((config, ctx) => {
		const issue = (path: string, message: string) =>
			ctx.addIssue({ code: 'custom', path: [path], message })
		if (config.BETTER_AUTH_SECRET === config.MEDIA_SIGNING_SECRET)
			issue('MEDIA_SIGNING_SECRET', 'Use a separate media secret')
		if (config.EMAIL_TRANSPORT === 'smtp' && !config.SMTP_URL)
			issue('SMTP_URL', 'SMTP_URL is required for SMTP email')
		if (config.REGISTRATION_MODE !== 'open' && !config.BOOTSTRAP_EMAIL)
			issue(
				'BOOTSTRAP_EMAIL',
				'Set the initial owner email for restricted registration'
			)
		if (config.S3_ENDPOINT && !config.S3_PUBLIC_ENDPOINT)
			issue('S3_PUBLIC_ENDPOINT', 'Set the browser accessible storage endpoint')
		if (config.PORT === config.PUBLIC_PORT)
			issue('PORT', 'Internal and public ports must differ')
		if (
			config.NODE_ENV === 'production' &&
			new URL(config.BETTER_AUTH_URL).protocol !== 'https:' &&
			!['localhost', '127.0.0.1'].includes(
				new URL(config.BETTER_AUTH_URL).hostname
			)
		)
			issue('BETTER_AUTH_URL', 'Production requires HTTPS')
	})
export type Config = z.infer<typeof configSchema>
export function loadConfig(environment: NodeJS.ProcessEnv): Config {
	const result = configSchema.safeParse(environment)
	if (!result.success)
		throw new Error(
			`Invalid configuration: ${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`
		)
	return result.data
}
