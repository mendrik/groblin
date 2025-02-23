import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { NotebookTextIcon } from 'lucide-react'
import { LoginDialog } from '../app/authentication/login-dialog.tsx'
import { Button } from '../ui/button.tsx'

export const LoginPage = () => {
	return (
		<div className="flex flex-row items-stretch min-h-screen w-full">
			<div className="flex-[1] bg-popover flex flex-col gap-4 items-center justify-center">
				<article className="prose prose-sm prose-slate dark:prose-invert w-2/3">
					<img
						src="https://mindmine-v2.s3.eu-north-1.amazonaws.com/images/gnome.png"
						className="w-1/2 m-auto"
						alt="Groblin logo"
					/>
					<h1>Groblin</h1>
					<p>
						Groblin is a headless content manager for small to midsize projects.
						It is open source and can be hosted on your own server.
					</p>
					<p>
						If you don't want to host it yourself you can buy storage space
						directly from this website.
					</p>
					<p>
						You can consume your stored content with graphql and structure it
						like a json document.
					</p>
				</article>
				<ol className="flex gap-4 flex-row items-center text-foreground">
					<li>
						<Button
							variant="ghost"
							className="flex items-center justify-center gap-2 p-2"
						>
							<GitHubLogoIcon className="grow-0 shrink-0 w-6 h-6" stroke="1" />
							<span>Github</span>
						</Button>
					</li>
					<li>
						<Button
							variant="ghost"
							className="flex items-center justify-center gap-2 p-2"
						>
							<NotebookTextIcon
								className="grow-0 shrink-0 w-6 h-6"
								strokeWidth={1.5}
							/>
							<span>Documentation</span>
						</Button>
					</li>
				</ol>
			</div>
			<main className="flex-[1] relative flex flex-col items-center justify-center">
				<LoginDialog />
			</main>
		</div>
	)
}
