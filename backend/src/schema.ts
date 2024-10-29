import { writeFileSync } from 'node:fs'
import { printSchema } from 'graphql'
import { schema } from './schema-builder.ts'

writeFileSync('../schema.graphql', printSchema(schema), {
	encoding: 'utf-8'
})
