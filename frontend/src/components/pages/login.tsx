import { Link } from 'wouter'
import { LoginDialog } from '../app/authentication/login-dialog.tsx'
export const LoginPage = () => (
	<div className="flex flex-col-reverse sm:flex-row items-stretch min-h-screen">
		<div className="bg-popover flex flex-col gap-4 items-center justify-center p-4 flex-1">
			<article className="prose prose-sm prose-slate dark:prose-invert max-w-md">
				<img src="/groblin.png" className="w-1/3 m-auto" alt="Groblin logo" />
				<h1>Groblin</h1>
				<p>
					A self-hosted content manager for structured content and articles.
					Define a model, work with your team, and publish a read-only GraphQL
					API for your website.
				</p>
				<p>
					Saved drafts, publication history and content recovery help you manage
					changes. Your operator controls registration, storage and backups.
				</p>
				<Link href="/guide">Read the first-project guide</Link>
			</article>
		</div>
		<main className="relative flex flex-col items-center justify-center p-4 flex-1">
			<LoginDialog />
		</main>
	</div>
)
