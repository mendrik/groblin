import 'dotenv/config'
import { type BinaryLike, scrypt } from 'node:crypto'
import { assertThat } from '@shared/asserts.ts'
import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import { resolveObj } from '@shared/utils/resolve-obj.ts'
import jwt from 'jsonwebtoken'
import type { Kysely } from 'kysely'
import ms from 'ms'
import { F, equals, isNil, isNotNil, pipe } from 'ramda'
import type { Context } from 'src/context.ts'
import type { DB } from 'src/database/schema.ts'
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

const userByEmail = (db: Kysely<DB>, email: string) =>
	db
		.selectFrom('user')
		.selectAll()
		.where('email', '=', email)
		.executeTakeFirst()

@Resolver()
export class AuthResolver {
	@Mutation(returns => Boolean)
	async register(
		@Arg('data', () => Registration) data: Registration,
		@Ctx() { db, pubSub }: Context
	) {
		const existingUser = await userByEmail(db, data.email)
		assertThat(isNil, existingUser, 'User already exists')

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
	async login(@Arg('data', () => Login) data: Login, @Ctx() ctx: Context) {
		const user = await userByEmail(ctx.db, data.email)
		const hashedPassword = await hashPassword(data.password)
		assertThat(isNotNil, user, 'User not found')
		assertThat(equals(user.password), hashedPassword, 'Invalid password')
		assertThat(isNotNil, jwtSecret, 'JWT_SECRET must be defined')

		const expiresIn = data.rememberMe ? '60 days' : '24h'
		const loggedInUser = {
			id: user.id,
			name: user.name,
			email: user.email
		} satisfies LoggedInUser
		ctx.extra = loggedInUser

		return {
			token: jwt.sign(loggedInUser, jwtSecret, { expiresIn }),
			expiresDate: new Date(Date.now() + ms(expiresIn))
		}
	}

	@Query(returns => LoggedInUser, { nullable: true })
	async whoami(@Ctx() ctx: Context) {
		return ctx.extra
	}

	@Mutation(returns => Boolean)
	async logout(@Ctx() ctx: Context) {
		ctx.extra = undefined
		return true
	}

	// todo forgot password, reset password
}
