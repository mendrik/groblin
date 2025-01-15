import { removeItems } from '@/lib/local-storage'
import { logout } from '@/state/user'
import type { Icon } from '@/type-patches/icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@radix-ui/react-tooltip'
import { pipeAsync } from '@shared/utils/pipe-async'
import {
	IconDatabaseExport,
	IconDatabaseImport,
	IconHome,
	IconKey,
	IconLogin2,
	IconSettings,
	IconUserCog
} from '@tabler/icons-react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { useLocation } from 'wouter'

type OwnProps = {
	icon: Icon
} & ButtonHTMLAttributes<HTMLButtonElement>

export const logoutCommand = pipeAsync(
	() => removeItems(['token', 'tokenExpiresDate']),
	logout
)

const IconLink = ({
	icon: Icon,
	children,
	...button
}: PropsWithChildren<OwnProps>) => (
	<li>
		<Tooltip delayDuration={0}>
			<TooltipTrigger {...button}>
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
	const [_, navigate] = useLocation()
	return (
		<div className="p-2 border-r">
			<TooltipProvider>
				<ul className="flex flex-col gap-y-2 text-muted-foreground">
					<IconLink icon={IconHome} onClick={() => navigate('/')}>
						Home
					</IconLink>
					<IconLink icon={IconSettings}>Settings</IconLink>
					<IconLink icon={IconKey} onClick={() => navigate('/api-keys')}>
						Api keys
					</IconLink>
					<IconLink icon={IconDatabaseExport}>Export</IconLink>
					<IconLink icon={IconDatabaseImport}>Import</IconLink>
					<IconLink icon={IconUserCog}>Profile</IconLink>
					<IconLink icon={IconLogin2} onClick={logoutCommand}>
						Logout
					</IconLink>
				</ul>
			</TooltipProvider>
		</div>
	)
}
