import { resolve } from 'node:path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

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
	}
})
