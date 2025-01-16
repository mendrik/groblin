import { assertThat } from '@shared/asserts'
import { isFunction } from 'ramda-adjunct'
import { type ReactNode, Suspense, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import useSWR, { type Key, type Fetcher, type SWRResponse } from 'swr'

type Swr<D, K extends Key> = (
	key: K,
	fetcher: Fetcher<D, K>
) => SWRResponse<D, Error>

type AwaitRunnerProps<D, K extends Key> = {
	jobId: K
	promise: Parameters<Swr<D, K>>[1]
	children: (data: SWRResponse<D, Error, K>) => ReactNode
}

const AwaitRunner = <D, K extends Key>({
	jobId,
	promise,
	children
}: AwaitRunnerProps<D, K>) => {
	assertThat(isFunction, children, 'children must be a function')
	const job = useSWR<D, Error, K>(jobId, promise)
	return children(job)
}

type OwnProps<D, K extends Key> = {
	fallback?: ReactNode
	error: ({ error }: { error?: Error }) => ReactNode
} & AwaitRunnerProps<D, K>

export const Await = <D, K extends Key>({
	fallback,
	error: ErrorCmp,
	...props
}: OwnProps<D, K>) => {
	const [err, setErr] = useState<Error>()
	return (
		<ErrorBoundary fallback={<ErrorCmp error={err} />} onError={setErr}>
			<Suspense fallback={fallback}>
				<AwaitRunner {...props} />
			</Suspense>
		</ErrorBoundary>
	)
}
