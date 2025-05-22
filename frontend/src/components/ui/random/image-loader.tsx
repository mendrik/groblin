import { throwError } from '@shared/errors'
import { Ban } from 'lucide-react'
import { caseOf, match } from 'matchblade'
import { T as _, isNotNil } from 'ramda'
import type { ReactNode } from 'react'
import useSWR from 'swr'
import { Skeleton } from '../skeleton'
import { MicroIcon } from './micro-icon'

type OwnProps = {
	src?: string
}

export const ImageLoader = ({ src }: OwnProps) => {
	const { data, isLoading, error } = useSWR(
		src,
		async (url: string) => {
			const res = await fetch(url)
			return res.ok
				? res.blob().then(URL.createObjectURL)
				: throwError(`Failed to fetch image`)
		},
		{ suspense: false }
	)

	return match<[boolean, Error, string | undefined], ReactNode>(
		caseOf([true, _, _], () => (
			<Skeleton className="w-full aspect-square rounded-xl" />
		)),
		caseOf([false, isNotNil<Error>, _], (_, error) => (
			<div className="flex flex-col items-center space-y-2">
				<MicroIcon icon={Ban} className="w-16 h-16 text-red-700" />
				<div>{error.message}</div>
			</div>
		)),
		caseOf([false, _, isNotNil<string>], (_, __, src) => (
			<img className="h-auto w-full" src={src} alt="" />
		))
	)(isLoading, error, data)
}
