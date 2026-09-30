import { z } from 'zod'

export enum Role {
	Owner = 'Owner',
	Admin = 'Admin',
	Editor = 'Editor',
	Viewer = 'Viewer'
}

export const roleSchema = z.enum(Role)
export const membershipRolesSchema = z.tuple([roleSchema])
export const invitationRoleSchema = z.enum([
	Role.Admin,
	Role.Editor,
	Role.Viewer
])
export const projectNameSchema = z.string().trim().min(1).max(160)
export const invitationEmailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email())

export const memberRole = (roles: unknown) =>
	membershipRolesSchema.parse(roles)[0]
export const roleAllowed = (roles: unknown, allowed: readonly string[]) => {
	const parsed = membershipRolesSchema.safeParse(roles)
	return (
		parsed.success &&
		(allowed.length === 0 ||
			parsed.data[0] === Role.Owner ||
			allowed.includes(parsed.data[0]))
	)
}
