import { removeItems } from '@/lib/local-storage'
import { logout } from '@/state/user'
import type { Icon as IconImg } from '@/type-patches/icons'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@radix-ui/react-tooltip'
import { pipeAsync } from '@shared/utils/pipe-async'
import {
	Database,
	House,
	Key,
	LogIn,
	Settings,
	UserCircleIcon
} from 'lucide-react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { useLocation } from 'wouter'
import { Icon } from '../ui/simple/icon'

type OwnProps = {
	icon: IconImg
} & ButtonHTMLAttributes<HTMLButtonElement>

export const logoutCommand = pipeAsync(
	() => removeItems(['token', 'tokenExpiresDate']),
	logout
)

const IconLink = ({
	icon,
	children,
	...button
}: PropsWithChildren<OwnProps>) => (
	<li>
		<Tooltip delayDuration={0}>
			<TooltipTrigger {...button}>
				<Icon
					icon={icon}
					size={20}
					color="currentColor"
					className="hover:text-foreground"
				/>
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
					<IconLink icon={House} onClick={() => navigate('/')}>
						Home
					</IconLink>
					<IconLink icon={Settings}>Settings</IconLink>
					<IconLink icon={Key} onClick={() => navigate('/api-keys')}>
						Api keys
					</IconLink>
					<IconLink icon={Key} onClick={() => navigate('/users')}>
						Users
					</IconLink>
					<IconLink icon={Database}>Export</IconLink>
					<IconLink icon={UserCircleIcon}>Profile</IconLink>
					<IconLink icon={LogIn} onClick={logoutCommand}>
						Logout
					</IconLink>
				</ul>
			</TooltipProvider>
		</div>
	)
}
