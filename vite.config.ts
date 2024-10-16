import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [['module:@preact/signals-react-transform']]
			}
		})
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	},
	test: {
		include: ['src/**/*.test.ts']
	}
})
