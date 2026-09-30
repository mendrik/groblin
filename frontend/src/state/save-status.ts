import { computed } from '@preact/signals-react'
import { settingsSaves } from './node-settings'
import { nodeSaves } from './tree'
import { valueSaves } from './value'

export const contentSaveQueues = [
	{ ...valueSaves, name: 'Values' },
	{ ...nodeSaves, name: 'Fields' },
	{ ...settingsSaves, name: 'Properties' }
]
export const hasPendingEdits = computed(() =>
	contentSaveQueues.some(queue => queue.hasPending.value)
)
