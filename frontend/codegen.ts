import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	overwrite: true,
	schema: ['../schema.graphql'],
	documents: ['src/**/*.{tsx,ts}'],
	generates: {
		'./src/gql/graphql.ts': {
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
