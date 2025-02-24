import { type BinaryLike, scrypt } from 'node:crypto'
import { SendEmailCommand } from '@aws-sdk/client-ses'
import { assertThat } from '@shared/asserts.ts'
import { awaitObj } from '@shared/utils/await-obj.ts'
import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import {
	type TReaderDocument,
	renderToStaticMarkup
} from '@usewaypoint/email-builder'
import resetPassword from 'emails/resetPassword.json' assert { type: 'json' }
import { inject, injectable } from 'inversify'
import jwt from 'jsonwebtoken'
import { Kysely } from 'kysely'
import ms from 'ms'
import { F, equals, isNil, isNotNil, pipe, when } from 'ramda'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { ProjectService } from 'src/services/project-service.ts'
import { SesClient } from 'src/services/ses-client.ts'
import { Topic } from 'src/types.ts'
import type { Context } from 'src/types.ts'
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	type PubSub,
	Resolver,
	UseMiddleware
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

	@Field(type => Int)
	lastProjectId?: number
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

const spec = {
	password: hashPassword,
	confirmed: F
}

const regToUser = pipe(evolveAlt<Registration, typeof spec>(spec), awaitObj)

@injectable()
@UseMiddleware(LogAccess)
@Resolver()
export class AuthResolver {
	@inject(ProjectService)
	private readonly projectService: ProjectService

	@inject('PubSub')
	private pubSub: PubSub

	@inject(Kysely)
	private readonly db: Kysely<DB>

	@inject(SesClient)
	private readonly sesClient: SesClient

	userByEmail = (email: string) =>
		this.db
			.selectFrom('user')
			.selectAll()
			.where('email', '=', email)
			.executeTakeFirst()

	@Mutation(returns => Boolean)
	async register(@Arg('data', () => Registration) data: Registration) {
		const existingUser = await this.userByEmail(data.email)
		assertThat(isNil, existingUser, 'User already exists')
		const user = await regToUser(data)
		const res = await this.db.insertInto('user').values(user).execute()
		this.pubSub.publish(Topic.UserRegistered, data)
		return res.length > 0
	}

	@Mutation(returns => Token)
	async login(@Arg('data', () => Login) data: Login, @Ctx() ctx: Context) {
		const user = await this.userByEmail(data.email)
		const hashedPassword = await hashPassword(data.password)

		assertThat(isNotNil, user, 'User not found')
		assertThat(equals(user.password), hashedPassword, 'Invalid password')
		assertThat(isNotNil, jwtSecret, 'JWT_SECRET must be defined')

		const expiresIn = data.rememberMe ? '60 days' : '24h'
		const init = () => this.projectService.initializeProject(ctx)

		const loggedInUser = pipe(
			evolveAlt({
				lastProjectId: pipe(x => x.last_project_id, when(isNil, init))
			}),
			awaitObj
		)
		ctx.user = await loggedInUser(user)
		return {
			token: jwt.sign(ctx.user, jwtSecret, { expiresIn: ms(expiresIn) }),
			expiresDate: new Date(Date.now() + ms(expiresIn))
		}
	}

	@Mutation(returns => Boolean)
	async logout(@Ctx() ctx: Context) {
		ctx.user = undefined as any
		return true
	}

	@Mutation(returns => Boolean)
	async forgotPassword(
		@Arg('data', () => ForgotPassword) data: ForgotPassword
	) {
		const email = new SendEmailCommand({
			Source: 'info@groblin.org',
			Destination: {
				ToAddresses: [data.email]
			},
			Message: {
				Body: {
					Html: {
						Data: renderToStaticMarkup(resetPassword as TReaderDocument, {
							rootBlockId: 'root'
						}),
						Charset: 'UTF-8'
					}
				},
				Subject: {
					Data: 'Forgot password',
					Charset: 'UTF-8'
				}
			}
		})
		await this.sesClient.send(email)
		return true
	}
}
