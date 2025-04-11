import 'dotenv/config'
import { resolve } from 'node:path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { type Plugin, defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths() as any] as Plugin[],
	resolve: {
		alias: {
			'@tp': resolve(__dirname, '../type-patches/src'),
			'@shared': resolve(__dirname, '../shared/src')
		}
	},
	test: {
		globals: true,
		globalSetup: ['./tests/vitest.setup.ts'],
		include: ['src/**/*.test.ts'],
		environment: 'node',
		testTimeout: 5000
	}
})
