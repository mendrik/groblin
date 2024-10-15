import { getItem, setItem } from '@/lib/local-storage'
import { signal } from '@preact/signals-react'

export const $panelSizes = signal(getItem('panelSizes', [25, 75]))

$panelSizes.subscribe(setItem('panelSizes'))
