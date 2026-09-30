import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	hooks: {
		afterAllFileWrite: ['pnpm exec biome check --write tests/test-sdk.ts']
	},
	schema: './tests/test-schema.graphql',
	documents: ['./src/**/*.test.ts'],
	generates: {
		'./tests/test-sdk.ts': {
			plugins: ['typescript-operations', 'typescript-generic-sdk'],
			config: {
				rawRequest: true,
				useTypeImports: true,
				documentMode: 'graphQLTag',
				gqlImport: 'graphql-tag#gql',
				enumsAsTypes: false,
				scalars: {
					DateTime: 'string',
					DateTimeISO: 'string',
					JSONObject: 'Record<string, any>'
				},
				skipTypename: true
			}
		}
	}
}

export default config
