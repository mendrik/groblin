import { lightYellow, yellow } from 'ansicolor'
import type { Context } from 'src/context.ts'
import type { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql'

const Content = /\s+\{(.|\n)*$/gim

export class LogAccess implements MiddlewareInterface<Context> {
	async use({ context, args }: ResolverData<Context>, next: NextFn) {
		const username: string = context.user?.name || 'guest'
		const { document, variableValues } = args

		if (variableValues) {
			console.log(
				yellow(`Gql: ${username} -> `) +
					lightYellow(document.loc?.source.body.replace(Content, '').trim()),
				variableValues
			)
		} else {
			console.log(
				yellow(`Gql: ${username} -> `) +
					lightYellow(document.loc?.source.body.replace(Content, '').trim())
			)
		}
		return next()
	}
}
