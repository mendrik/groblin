import {} from '@/components/ui/sidebar'
import { setSignal } from '@/lib/utils'
import type { Icon } from '@/type-patches/icons'
import { signal } from '@preact/signals-react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@radix-ui/react-tooltip'
import {
	IconDatabaseExport,
	IconDatabaseImport,
	IconLogin2,
	IconSettings,
	IconUserCog
} from '@tabler/icons-react'
import { F, T, pipe } from 'ramda'
import type { PropsWithChildren } from 'react'

export const $dimmer = signal(false)

type OwnProps = {
	icon: Icon
}

const IconLink = ({ icon: Icon, children }: PropsWithChildren<OwnProps>) => (
	<li>
		<Tooltip delayDuration={0}>
			<TooltipTrigger>
				<Icon className="w-6 h-6" stroke={1} />
			</TooltipTrigger>
			<TooltipContent
				sideOffset={5}
				side="right"
				className="bg-background border border-border rounded-sm px-2 py-0 shadow-2xl z-10 text-foreground"
			>
				{children}
			</TooltipContent>
		</Tooltip>
	</li>
)

export const AppSidebar = () => {
	return (
		<div
			className="p-2 border-r"
			onMouseEnter={pipe(T, setSignal($dimmer))}
			onMouseLeave={pipe(F, setSignal($dimmer))}
		>
			<TooltipProvider>
				<ul className="flex flex-col gap-y-2 text-border">
					<IconLink icon={IconSettings}>Settings</IconLink>
					<IconLink icon={IconDatabaseExport}>Export</IconLink>
					<IconLink icon={IconDatabaseImport}>Import</IconLink>
					<IconLink icon={IconUserCog}>Profile</IconLink>
					<IconLink icon={IconLogin2}>Logout</IconLink>
				</ul>
			</TooltipProvider>
		</div>
	)
}
