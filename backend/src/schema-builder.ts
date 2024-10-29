import 'dotenv/config'
import 'reflect-metadata'
import type { AnyFn } from '@tp/functions.ts'
import fg from 'fast-glob'
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

export const schema = await buildSchema({ resolvers })
