import { getItem, setItemAsync } from '@/lib/local-storage'
import { signal } from '@preact/signals-react'

export const $panelSizes = signal(getItem('panelSizes', [25, 75]))

export const setPanelSizes = setItemAsync('panelSizes')
