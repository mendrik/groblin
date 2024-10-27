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
	server: {
		proxy: {
			'/rest': {
				target: 'http://localhost:6173',
				changeOrigin: true,
				secure: false,
				ws: true
			}
		}
	},
	resolve: {
		alias: {
			'@shared': resolve(__dirname, '../shared/src'),
			'@': resolve(__dirname, './src')
		}
	},
	test: {
		setupFiles: ['vitest-localstorage-mock'],
		include: ['src/**/*.test.ts']
	}
})
