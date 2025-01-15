import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent } from 'react'

export type Icon = ForwardRefExoticComponent<
	Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>
