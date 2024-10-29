import {} from 'ramda'
import { Field, InputType, Resolver } from 'type-graphql'

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
	// @Subscription(returns => Boolean, {
	// 	topics: 'AUTH_CHANGED'
	// })
	// authChanged() {
	// 	return true
	// }
	//
	// @Mutation(returns => Boolean)
	// async register(
	// 	@Arg('data') data: Registration,
	// 	@Ctx() ctx: Context
	// ) {
	// 	const { db } = ctx
	// 	const { name, email, password } = data
	//
	// 	const existingUser = await db.users.findFirst({
	// 		where: { email }
	// 	})
	//
	// 	if (existingUser) {
	// 		throw new Error('User already exists')
	// 	}
	//
	// 	await db.users.create({
	// 		data: {
	// 			name,
	// 			email,
	// 			password
	// 		}
	// 	})
	//
	// 	return true
	// }
	//
	// @Mutation(returns => Boolean)
	// async login(
	// 	@Arg('data') data: Login,
	// 	@Ctx() ctx: Context
	// ) {
	// 	const { db } = ctx
	// 	const { email, password } = data
	//
	// 	const user = await db.users.findFirst({
	// 		where: { email }
	// 	})
	//
	// 	if (!user) {
	// 		throw new Error('User not found')
	// 	}
	//
	// 	if (user.password !== password) {
	// 		throw new Error('Invalid password')
	// 	}
	//
	// 	return true
	// }
	//
	// @Mutation(returns => Boolean)
	// async forgotPassword(
	// 	@Arg('data') data: ForgotPassword,
	// 	@Ctx() ctx: Context
	// ) {
	// 	const { db } = ctx
	// 	const { email } = data
	//
	// 	const user = await db.users.findFirst({
	// 		where: { email }
	// 	})
	//
	// 	if (!user) {
	// 		throw new Error('User not found')
}
