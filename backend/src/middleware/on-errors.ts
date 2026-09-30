import type { ServerOptions } from 'graphql-ws'
import { log } from '../utils/log.ts'
export const onError: ServerOptions['onError'] = (
	_ctx,
	id,
	_payload,
	errors
) => {
	log('graphql_operation_failed', {
		operationId: id,
		errorCount: errors.length
	})
}
