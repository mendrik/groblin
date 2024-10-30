import 'dotenv/config'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		tsconfigPaths(),
		checker({ typescript: true }),
		react({
			babel: {
				plugins: [['module:@preact/signals-react-transform']]
			}
		})
	],
	resolve: {
		alias: {
			'@tp': resolve(__dirname, '../type-patches/src'),
			'@shared': resolve(__dirname, '../shared/src'),
			'@': resolve(__dirname, './src')
		}
	},
	test: {
		setupFiles: ['vitest-localstorage-mock'],
		include: ['src/**/*.test.ts']
	}
})
