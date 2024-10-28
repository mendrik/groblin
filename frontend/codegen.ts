import type { CodegenConfig } from '@graphql-codegen/cli'
import { BigIntResolver } from 'graphql-scalars'

const config: CodegenConfig = {
	overwrite: true,
	schema: '../schema.graphql',
	documents: 'src/**/*.{tsx,ts}',
	generates: {
		'./src/gql/': {
			preset: 'client',
			config: {
				documentMode: 'string',
				scalars: {
					Int: BigIntResolver
				}
			}
		}
	}
}

export default config
