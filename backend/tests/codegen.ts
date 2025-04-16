import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	schema: './tests/test-schema.graphql',
	documents: ['./src/**/*.test.ts'],
	generates: {
		'./tests/gql/': {
			plugins: [
				'typescript',
				'typescript-operations',
				'typescript-generic-sdk'
			],
			config: {
				rawRequest: true,
				useTypeImports: true,
				documentMode: 'string',
				skipTypename: true
			}
		}
	}
}

export default config
