import { blue, green, lightYellow, yellow } from 'ansicolor'
import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql'

const Content = /\s+\{(.|\n)*$/gim

@injectable()
export class LogAccess implements MiddlewareInterface<Context> {
	async use(
		{ context, args, info, root }: ResolverData<Context>,
		next: NextFn
	) {
		const username: string = context.user?.name || 'guest'
		const { variableValues } = args
		console.log(
			`${yellow(`Gql:`)} ${green(username)} ${blue(info.path.typename)} ${lightYellow(info.path.key)}`
		)
		if (variableValues) {
			console.log(variableValues)
		}
		return next()
	}
}
