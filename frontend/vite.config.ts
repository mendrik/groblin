import 'dotenv/config'
import { resolve } from 'node:path'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		babel({ plugins: ['module:@preact/signals-react-transform'] }),
		tailwindcss()
	] as ViteUserConfig['plugins'],
	resolve: {
		tsconfigPaths: true,
		alias: {
			'@tp': resolve(import.meta.dirname, '../type-patches'),
			'@shared': resolve(import.meta.dirname, '../shared/src'),
			'@': resolve(import.meta.dirname, './src')
		}
	},
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.test.{ts,tsx}',
				'src/**/*.d.ts',
				'src/gql/**',
				'src/test.setup.ts'
			],
			reporter: ['text', 'html', 'json-summary', 'lcov'],
			thresholds: {
				lines: 26,
				statements: 25,
				functions: 17,
				branches: 21,
				'src/components/app/authentication/*.tsx': {
					lines: 100,
					statements: 95,
					functions: 90,
					branches: 100
				},
				'src/gql-client.ts': {
					lines: 100,
					statements: 95,
					functions: 100,
					branches: 85
				}
			}
		},
		setupFiles: ['src/test.setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		environment: 'happy-dom',
		testTimeout: 5000
	},
	server: {
		proxy: {
			'/content': { target: 'http://localhost:4001', rewrite: path => path.replace(/^\/content/, '') },
			'/graphql': { target: 'ws://localhost:6173', ws: true },
			'/media': { target: 'http://localhost:4001' },
			'/api': {
				target: 'http://localhost:4001',
				changeOrigin: true
			}
		}
	}
})
