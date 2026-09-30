import 'dotenv/config'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		tsconfigPaths: true,
		alias: {
			'@tp': resolve(import.meta.dirname, '../type-patches'),
			'@shared': resolve(import.meta.dirname, '../shared/src'),
			graphql: resolve(import.meta.dirname, '../node_modules/graphql/index.mjs')
		}
	},
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.test.{ts,tsx}',
				'src/**/*.d.ts',
				'src/database/schema.ts'
			],
			reporter: ['text', 'html', 'json-summary', 'lcov'],
			thresholds: {
				lines: 80,
				statements: 80,
				functions: 80,
				branches: 65,
				'src/resolvers/**': {
					lines: 95,
					statements: 95,
					functions: 95,
					branches: 60
				},
				'src/security/**': {
					lines: 100,
					statements: 95,
					functions: 100,
					branches: 95
				},
				'src/middleware/on-connect.ts': {
					lines: 100,
					statements: 100,
					functions: 100,
					branches: 100
				}
			}
		},
		globalSetup: ['./tests/global.ts'],
		include: ['src/**/*.test.ts'],
		environment: 'node',
		testTimeout: 5000
	}
})
