import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@radix-ui/react-tooltip'
import {
	BookOpen,
	History,
	House,
	Key,
	LogIn,
	Settings,
	Upload,
	UserCircleIcon,
	Users
} from 'lucide-react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { useLocation } from 'wouter'
import { disconnect } from '@/gql-client'
import { signOut } from '@/lib/auth-client'
import { $canManage } from '@/state/access'
import { $user } from '@/state/user'
import type { Icon as IconImg } from '@/type-patches/icons'
import { openContentHistory } from '../ui/content-history'
import { Icon } from '../ui/simple/icon'

type OwnProps = {
	icon: IconImg
} & ButtonHTMLAttributes<HTMLButtonElement>

const IconLink = ({
	icon,
	children,
	...button
}: PropsWithChildren<OwnProps>) => (
	<li>
		<Tooltip delayDuration={0}>
			<TooltipTrigger
				aria-label={typeof children === 'string' ? children : undefined}
				{...button}
			>
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
				className="bg-muted border border-border rounded-xs px-4 py-2 z-10 text-foreground drop-shadow-tooltip"
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
					<IconLink icon={BookOpen} onClick={() => navigate('/guide')}>
						Guide
					</IconLink>
					<IconLink icon={House} onClick={() => navigate('/')}>
						Home
					</IconLink>
					<IconLink icon={History} onClick={openContentHistory}>
						Content history
					</IconLink>
					<IconLink icon={Settings} onClick={() => navigate('/projects')}>
						Projects
					</IconLink>
					<IconLink icon={Upload} onClick={() => navigate('/publication')}>
						Publication
					</IconLink>
					{$canManage.value && (
						<>
							<IconLink icon={Key} onClick={() => navigate('/api-keys')}>
								Api keys
							</IconLink>
							<IconLink icon={Users} onClick={() => navigate('/users')}>
								Users
							</IconLink>
						</>
					)}
					<IconLink icon={UserCircleIcon} onClick={() => navigate('/profile')}>
						Profile
					</IconLink>
					<IconLink
						icon={LogIn}
						onClick={() =>
							signOut({
								fetchOptions: {
									onSuccess: async () => {
										await disconnect()
										$user.value = undefined
										localStorage.removeItem('tree-state')
										window.location.replace('/')
									}
								}
							})
						}
					>
						Logout
					</IconLink>
				</ul>
			</TooltipProvider>
		</div>
	)
}
