import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
 schema: '../schema.graphql',
 generates: {
  'src/gql/schema.ts': {
   plugins: ['typescript', 'typescript-resolvers'],
   config: {
    useTypeImports: true,
    avoidOptionals: { field: true },
    skipTypename: true,
    contextType: '../types.ts#Context',
    enumValues: { NodeType: '../types.ts#NodeType', Role: '../types.ts#Role' },
    scalars: { DateTime: 'Date', DateTimeISO: 'Date', JSONObject: '../database/schema.ts#JsonValue' },
    makeResolverTypeCallable: true
   }
  }
 }
}
export default config
