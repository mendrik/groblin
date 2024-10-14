import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	overwrite: true,
	schema: 'http://localhost:8080/v1/graphql',
	documents: 'src/**/*.{tsx,ts}',
	generates: {
		'./src/gql/': {
			preset: 'client',
			config: {
				documentMode: 'string'
			}
		},
		'./graphql.schema.json': {
			plugins: ['introspection']
		}
	}
}

export default config
