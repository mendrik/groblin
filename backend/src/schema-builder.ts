import 'dotenv/config'
import 'reflect-metadata'
import { basename } from 'node:path'
import type { AnyFn } from '@tp/functions.ts'
import { cyan, darkGray } from 'ansicolor'
import fg from 'fast-glob'
import { type NonEmptyArray, flatten, map, values } from 'ramda'
import { allP } from 'ramda-adjunct'
import { buildSchema } from 'type-graphql'
import { pubSub } from './pubsub.ts'

const resolvers: NonEmptyArray<AnyFn> = await fg('./src/resolvers/**/*.ts')
	.then(
		map<string, any>(file => {
			console.log(`${darkGray('Res:')} ${cyan(basename(file))}`)
			return import(file.replace('./src/', 'src/')).then(values)
		})
	)
	.then(allP)
	.then<any>(flatten)

export const schema = await buildSchema({ resolvers, pubSub })
