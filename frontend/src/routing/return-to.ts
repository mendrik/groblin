const invitationPath = (path: string | null) =>
	path && /^\/invite\/gri_[A-Za-z0-9_-]{43}$/.test(path) ? path : undefined
const key = 'groblin:invitation-return'
export const rememberInvitation = (path: string) => {
	const safe = invitationPath(path)
	if (safe) sessionStorage.setItem(key, safe)
}
export const invitationReturn = () =>
	invitationPath(sessionStorage.getItem(key)) ?? '/'
export const clearInvitationReturn = () => sessionStorage.removeItem(key)
