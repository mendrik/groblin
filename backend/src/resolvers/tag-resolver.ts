import { Role } from '@shared/enums.ts'
import { failOn } from '@shared/utils/guards.ts'
import { injectable } from 'inversify'
import { sql } from 'kysely'
import { T, isNil } from 'ramda'
import type { Context } from 'src/context.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Subscription,
	UseMiddleware
} from 'type-graphql'

@ObjectType()
export class Tag {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => Boolean)
	master: boolean

	@Field(type => Int, { nullable: true })
	parent_id: number
}

@InputType()
export class InsertTag {
	@Field(type => String)
	name: string

	@Field(type => Int, { nullable: true })
	parent_id?: number
}

@InputType()
export class ChangeTagInput {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => Int, { nullable: true })
	parent_id?: number
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class TagResolver {
	@Subscription(returns => Boolean, {
		topics: Topic.TagsUpdated,
		filter: T
	})
	tagsUpdated() {
		return true
	}

	@Query(returns => [Tag])
	getTags(@Ctx() { db, extra: user }: Context) {
		return db
			.selectFrom('tag')
			.selectAll()
			.where('project_id', '=', user.lastProjectId)
			.orderBy('order', 'asc')
			.execute()
	}

	@Mutation(returns => Tag)
	async insertTag(
		@Arg('data', () => InsertTag) data: InsertTag,
		@Ctx() { db, pubSub, extra: user }: Context
	): Promise<Tag> {
		const { max_order } = (await db
			.selectFrom('tag')
			.select(sql`max("order")`.as('max_order'))
			.where('project_id', '=', user.lastProjectId)
			.executeTakeFirstOrThrow()) as { max_order: number }

		const { id } = await db
			.insertInto('tag')
			.values({
				...data,
				project_id: user.lastProjectId,
				order: max_order + 1
			})
			.returning('id')
			.executeTakeFirstOrThrow()

		pubSub.publish(Topic.TagsUpdated, true)
		return await this.getTag(db, id)
	}

	async getTag(db: Context['db'], id: number): Promise<Tag> {
		return db
			.selectFrom('tag')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()
			.then(failOn(isNil, 'Tag not found')) as Promise<Tag>
	}

	@Mutation(returns => Boolean)
	async updateTag(
		@Arg('data', () => ChangeTagInput) data: ChangeTagInput,
		@Ctx() { db, pubSub, extra: user }: Context
	): Promise<boolean> {
		const { numUpdatedRows = 0 } = await db
			.updateTable('tag')
			.set(data)
			.where('id', '=', data.id)
			.where('project_id', '=', user.lastProjectId)
			.executeTakeFirst()
		pubSub.publish(Topic.TagsUpdated, true)
		return numUpdatedRows > 0 // Returns true if at least one row was updated
	}

	@Mutation(returns => Boolean)
	async deleteTagById(
		@Arg('id', () => Int) id: number,
		@Ctx() { db, pubSub, extra: user }: Context
	): Promise<boolean> {
		const { numDeletedRows } = await db
			.deleteFrom('tag')
			.where('id', '=', id)
			.where('project_id', '=', user.lastProjectId)
			.executeTakeFirst()
		pubSub.publish(Topic.TagsUpdated, true)
		return numDeletedRows > 0
	}
}
