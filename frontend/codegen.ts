import type { CodegenConfig } from '@graphql-codegen/cli'
import {
	BigIntResolver,
	DateTimeResolver,
	SafeIntResolver
} from 'graphql-scalars'

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
					BigInt: BigIntResolver,
					DateTime: DateTimeResolver,
					Int: SafeIntResolver
				}
			}
		}
	}
}

export default config
