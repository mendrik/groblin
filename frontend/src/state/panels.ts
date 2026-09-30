import { signal } from '@preact/signals-react'
import type { Layout } from 'react-resizable-panels'
import { getItem, setItemAsync } from '@/lib/local-storage'

const initial: Layout = { tree: 25, values: 35, preview: 40 }
const stored: unknown = getItem('panelLayout', initial)
const isLayout = (value: unknown): value is Layout =>
	typeof value === 'object' &&
	value !== null &&
	!Array.isArray(value) &&
	['tree', 'values', 'preview'].every(
		key =>
			key in value &&
			typeof Reflect.get(value, key) === 'number' &&
			Number.isFinite(Reflect.get(value, key)) &&
			Reflect.get(value, key) > 0
	)

export const $panelSizes = signal(isLayout(stored) ? stored : initial)
const persist = setItemAsync('panelLayout')
export const setPanelSizes = (layout: Layout) => {
	$panelSizes.value = layout
	persist(layout)
}
