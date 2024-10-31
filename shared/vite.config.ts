import 'dotenv/config'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths(), checker({ typescript: true })],
	test: {
		include: ['src/**/*.test.ts']
	}
})
