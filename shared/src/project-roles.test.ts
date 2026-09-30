import { expect, test } from 'vitest'
import {
	invitationEmailSchema,
	invitationRoleSchema,
	memberRole,
	projectNameSchema,
	Role,
	roleAllowed
} from './project-roles.ts'

test('canonical membership has exactly one role; Owner has all project permissions', () => {
	expect(memberRole([Role.Editor])).toBe(Role.Editor)
	expect(roleAllowed([Role.Owner], [Role.Admin])).toBe(true)
	expect(roleAllowed([Role.Editor], [Role.Admin])).toBe(false)
	expect(roleAllowed([Role.Viewer], [])).toBe(true)
	expect(roleAllowed([], [])).toBe(false)
	expect(roleAllowed([Role.Owner, Role.Viewer], [Role.Admin])).toBe(false)
	expect(() => invitationRoleSchema.parse(Role.Owner)).toThrow()
})

test('project and invitation inputs normalize at the shared boundary', () => {
	expect(projectNameSchema.parse('  Example  ')).toBe('Example')
	expect(invitationEmailSchema.parse('  READER@example.invalid  ')).toBe(
		'reader@example.invalid'
	)
	expect(() => projectNameSchema.parse(' ')).toThrow()
	expect(() => projectNameSchema.parse('x'.repeat(161))).toThrow()
	expect(() => invitationEmailSchema.parse('invalid')).toThrow()
})
