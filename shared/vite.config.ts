import 'dotenv/config'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
			reporter: ['text', 'html', 'json-summary', 'lcov'],
			thresholds: { lines: 60, statements: 63, functions: 67, branches: 65 }
		},
		include: ['src/**/*.test.ts']
	}
})
