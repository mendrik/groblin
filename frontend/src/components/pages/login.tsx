import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { NotebookTextIcon } from 'lucide-react'
import { LoginDialog } from '../app/authentication/login-dialog.tsx'
import { Button } from '../ui/button.tsx'

export const LoginPage = () => {
	return (
		<div className="flex flex-col-reverse sm:flex-row items-stretch min-h-screen">
			<div className="bg-popover flex flex-col gap-4 items-center justify-center p-4 flex-[1]">
				<article className="prose prose-sm prose-slate dark:prose-invert w-2/3">
					<img
						src="https://mindmine-v2.s3.eu-north-1.amazonaws.com/images/gnome.png"
						className="w-1/3 m-auto"
						alt="Groblin logo"
					/>
					<h1>Groblin</h1>
					<p>
						Meet Groblin — a sleek, modern content manager designed to simplify
						your workflow for small to midsize projects. Lightweight,
						open-source, and highly flexible, Groblin is here to help you
						organize and deliver content with ease. Whether you're a developer,
						a content creator, or just someone who values efficiency, Groblin
						has you covered.
					</p>
					<p>
						As a headless content manager, Groblin gives you full control. You
						can host it on your own server, keeping everything in your hands.
						Prefer a hassle-free option? No problem — you can purchase storage
						space directly from this website and let Groblin handle the heavy
						lifting.
					</p>
					<p>
						What makes Groblin stand out is its versatility. You can access your
						stored content using GraphQL and structure it like a JSON document,
						making it a powerful tool for developers and teams alike. It’s
						simple to use yet packed with the features you need to manage
						content effectively.
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
			<main className="relative flex flex-col items-center justify-center p-4 flex-[1]">
				<LoginDialog />
			</main>
		</div>
	)
}
