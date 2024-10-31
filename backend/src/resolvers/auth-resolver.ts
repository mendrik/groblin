import 'dotenv/config'
import { type BinaryLike, scrypt } from 'node:crypto'
import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import { resolveObj } from '@shared/utils/resolve-obj.ts'
import jwt from 'jsonwebtoken'
import ms from 'ms'
import { F, pipe } from 'ramda'
import type { Context } from 'src/context.ts'
import { Topic } from 'src/pubsub.ts'
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver
} from 'type-graphql'

const jwtSecret = process.env.JWT_SECRET

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

@ObjectType()
export class Token {
	@Field(type => String)
	token: string

	@Field(type => Date)
	expiresDate: Date
}

@ObjectType()
export class LoggedInUser {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

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

	@Field(type => Boolean, { nullable: true })
	rememberMe?: boolean
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

	@Mutation(returns => Token)
	async login(@Arg('data', () => Login) data: Login, @Ctx() { db }: Context) {
		const user = await db
			.selectFrom('user')
			.selectAll()
			.where('email', '=', data.email)
			.executeTakeFirst()

		if (!user) {
			throw new Error('User not found')
		}

		const hashedPassword = await hashPassword(data.password)

		if (user.password !== hashedPassword) {
			throw new Error('Invalid password')
		}

		if (jwtSecret === undefined) {
			throw new Error('JWT_SECRET must be defined')
		}

		const expiresIn = data.rememberMe ? '60 days' : '24h'
		const token = jwt.sign(
			{ id: user.id, name: user.name, email: user.email },
			jwtSecret,
			{ expiresIn }
		)
		const expiresDate = new Date(Date.now() + ms(expiresIn))

		return { token, expiresDate }
	}

	@Query(returns => LoggedInUser)
	async whoami(@Ctx() { user }: Context) {
		return user
	}

	/*
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
