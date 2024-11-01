import { assertExists } from '@shared/asserts.ts'
import { Role } from '@shared/enums.ts'
import { failOn } from '@shared/utils/guards.ts'
import { injectable } from 'inversify'
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
	getTags(@Ctx() { db }: Context) {
		return db.selectFrom('tag').selectAll().orderBy('id', 'asc').execute()
	}

	@Mutation(returns => Tag)
	async insertTag(
		@Arg('data', () => InsertTag) data: InsertTag,
		@Ctx() { db, pubSub }: Context
	): Promise<Tag> {
		const res = await db
			.insertInto('tag')
			.values(data)
			.returning('id as id')
			.executeTakeFirst()

		assertExists(res?.id, 'Failed to insert tag')
		pubSub.publish(Topic.TagsUpdated, true)
		return await this.getTag(db, res.id)
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
		@Ctx() { db, pubSub }: Context
	): Promise<boolean> {
		const { numUpdatedRows = 0 } = await db
			.updateTable('tag')
			.set(data)
			.where('id', '=', data.id)
			.executeTakeFirst()
		pubSub.publish(Topic.TagsUpdated, true)
		return numUpdatedRows > 0 // Returns true if at least one row was updated
	}

	@Mutation(returns => Boolean)
	async deleteTagById(
		@Arg('id', () => Int) id: number,
		@Ctx() { db, pubSub }: Context
	): Promise<boolean> {
		const { numDeletedRows } = await db
			.deleteFrom('tag')
			.where('id', '=', id)
			.executeTakeFirst()
		pubSub.publish(Topic.TagsUpdated, true)
		return numDeletedRows > 0
	}
}
