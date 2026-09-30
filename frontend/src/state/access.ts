import { computed, signal } from '@preact/signals-react'
import { Role } from '@shared/project-roles'

export const $currentRole = signal<Role>()
export const $projectChanging = signal(false)
export const $canManage = computed(
	() =>
		!$projectChanging.value &&
		($currentRole.value === Role.Owner || $currentRole.value === Role.Admin)
)
export const $canEdit = computed(
	() =>
		!$projectChanging.value &&
		($canManage.value || $currentRole.value === Role.Editor)
)
export const $isOwner = computed(() => $currentRole.value === Role.Owner)
export const requireManage = () => {
	if (!$canManage.peek())
		throw new Error(
			'Only the Owner or an administrator can change the project model.'
		)
}
export const requireEdit = () => {
	if (!$canEdit.peek())
		throw new Error('Your project role does not allow content changes.')
}
