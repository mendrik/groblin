import {} from 'ramda'
import type { Context } from 'src/context.ts'
import { Topic } from 'src/pubsub.ts'
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from 'type-graphql'

@InputType()
export class Registration {
	@Field(type => String)
	name: string

	@Field(type => String)
	password: string

	@Field(type => String)
	email: string
}

@InputType()
export class ForgotPassword {
	@Field(type => String)
	email: string
}

@InputType()
export class Login {
	@Field(type => String)
	email: string

	@Field(type => String)
	password: string
}

@Resolver()
export class AuthResolver {
	@Mutation(returns => Boolean)
	async register(
		@Arg('data', () => Registration) data: Registration,
		@Ctx() { db, pubSub }: Context
	) {
		const existingUser = await db
			.selectFrom('user')
			.selectAll()
			.where('email', '=', data.email)
			.executeTakeFirst()

		if (existingUser) {
			throw new Error('User already exists')
		}

		const res = await db
			.insertInto('user')
			.values({
				...data,
				confirmed: 0
			})
			.execute()
		pubSub.publish(Topic.UserRegistered, data)
		return res.length > 0
	}

	/* 
	@Mutation(returns => Boolean)
	async login(@Arg('data') data: Login, @Ctx() ctx: Context) {
		const { db } = ctx
		const { email, password } = data

		const user = await db.users.findFirst({
			where: { email }
		})

		if (!user) {
			throw new Error('User not found')
		}

		if (user.password !== password) {
			throw new Error('Invalid password')
		}

		return true
	}

	@Mutation(returns => Boolean)
	async forgotPassword(@Arg('data') data: ForgotPassword, @Ctx() ctx: Context) {
		const { db } = ctx
		const { email } = data

		const user = await db.users.findFirst({
			where: { email }
		})

		if (!user) {
			throw new Error('User not found')
		}
	}
 */
}
