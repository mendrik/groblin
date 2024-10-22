import {} from '@/components/ui/sidebar'
import type { Icon } from '@/type-patches/icons'
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
import {} from 'ramda'
import type { PropsWithChildren } from 'react'

type OwnProps = {
	icon: Icon
}

const IconLink = ({ icon: Icon, children }: PropsWithChildren<OwnProps>) => (
	<li>
		<Tooltip delayDuration={0}>
			<TooltipTrigger>
				<Icon className="w-6 h-6 hover:text-foreground" stroke={1} />
			</TooltipTrigger>
			<TooltipContent
				sideOffset={5}
				side="right"
				className="bg-muted border border-border rounded-sm px-4 py-2 z-10 text-foreground drop-shadow-tooltip"
			>
				{children}
			</TooltipContent>
		</Tooltip>
	</li>
)

export const AppSidebar = () => {
	return (
		<div className="p-2 border-r">
			<TooltipProvider>
				<ul className="flex flex-col gap-y-2 text-muted-foreground">
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
