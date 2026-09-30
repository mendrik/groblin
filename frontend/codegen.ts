import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
	hooks: { afterAllFileWrite: ['pnpm exec biome check --write src/gql'] },
 overwrite: true,
 schema: '../schema.graphql',
 documents: ['src/gql/**/*.graphql'],
 config: {
  useTypeImports: true,
  skipTypename: true,
  scalars: { DateTime: 'string', DateTimeISO: 'string', JSONObject: 'Record<string, any>' }
 },
 generates: {
  'src/gql/schema.ts': { plugins: ['typescript'] },
  'src/gql/graphql.ts': {
   plugins: [
    { add: { content: "export * from './schema'" } },
    'typescript-operations', 'typescript-generic-sdk'
   ],
   config: { rawRequest: true, documentMode: 'graphQLTag',
 gqlImport: 'graphql-tag#gql',
 enumsAsTypes: false, importSchemaTypesFrom: './src/gql/schema', namespacedImportName: 'Types' }
  }
 }
}
export default config
