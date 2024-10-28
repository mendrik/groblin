import 'dotenv/config'
import 'reflect-metadata'
import { writeFileSync } from 'node:fs'
import type { AnyFn } from '@tp/functions.ts'
import fg from 'fast-glob'
import { printSchema } from 'graphql'
import { type NonEmptyArray, flatten, map, values } from 'ramda'
import { allP } from 'ramda-adjunct'
import { buildSchema } from 'type-graphql'

const resolvers: NonEmptyArray<AnyFn> = await fg('./src/resolvers/**/*.ts')
	.then(
		map<string, any>(file =>
			import(file.replace('./src/', 'src/')).then(values)
		)
	)
	.then(allP)
	.then<any>(flatten)

console.log('Loaded resolvers:', ...resolvers)

const schema = await buildSchema({ resolvers })
writeFileSync('../schema.graphql', printSchema(schema), {
	encoding: 'utf-8'
})
