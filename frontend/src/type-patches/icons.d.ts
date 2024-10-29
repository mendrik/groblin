import type { IconProps, Icon as TIcon } from '@tabler/icons-react'

export type Icon = React.ForwardRefExoticComponent<
	IconProps & React.RefAttributes<TIcon>
>
