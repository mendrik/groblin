import { type BinaryLike, scrypt } from 'node:crypto'
import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import { resolveObj } from '@shared/utils/resolve-obj.ts'
import { F, pipe } from 'ramda'
import type { Context } from 'src/context.ts'
import { Topic } from 'src/pubsub.ts'
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from 'type-graphql'

const crypt = (
	password: BinaryLike,
	salt: BinaryLike,
	keylen: number
): Promise<string> =>
	new Promise((resolve, reject) => {
		scrypt(password, salt, keylen, (err, derivedKey) => {
			if (err) {
				reject(err)
			} else {
				resolve(derivedKey.toString('hex'))
			}
		})
	})

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

const hashPassword = (password: string): Promise<string> =>
	crypt(password, 'salt', 64)

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

		const regToUser = pipe(
			evolveAlt({
				password: hashPassword,
				confirmed: F
			}),
			resolveObj
		)

		const user = await regToUser(data)

		const res = await db.insertInto('user').values(user).execute()
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
