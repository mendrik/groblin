import type { PropsWithChildren } from 'react'

type OwnProps<T> = {
	list: T[]
}

export const EmptyList = <T,>({
	list,
	children
}: PropsWithChildren<OwnProps<T>>) => {
	return !list.length ? children : null
}
