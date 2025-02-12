import 'dotenv/config'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { type ViteUserConfig, defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		tsconfigPaths(),
		react({
			babel: {
				plugins: [
					['module:@preact/signals-react-transform']
					//['babel-plugin-react-compiler']
				]
			}
		})
	] as ViteUserConfig['plugins'],
	resolve: {
		alias: {
			'@tp': resolve(__dirname, '../type-patches/src'),
			'@shared': resolve(__dirname, '../shared/src'),
			'@': resolve(__dirname, './src')
		}
	},
	test: {
		setupFiles: ['vitest-localstorage-mock', 'src/test.setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		environment: 'happy-dom',
		testTimeout: 5000
	}
})
