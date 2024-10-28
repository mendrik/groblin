import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	overwrite: true,
	schema: '../schema.graphql',
	documents: 'src/**/*.{tsx,ts}',
	generates: {
		'./src/gql/': {
			preset: 'client',
			config: {
				documentMode: 'string'
			}
		}
	}
}

export default config
