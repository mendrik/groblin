import { Link } from 'wouter'
import { Page } from './page'
export function Guide() {
	return (
		<Page>
			<h1>Your first project</h1>
			<p>
				Groblin keeps a saved draft separate from the content your website
				receives. Administrators define fields and publish; editors maintain
				content.
			</p>
			<ol>
				<li>
					Register with the owner email configured by your operator, or follow
					an invitation. Verify your email and sign in.
				</li>
				<li>
					Open <Link href="/projects">Projects</Link> to select or create a
					project. Open Home and choose Add node. Start with a String named
					Title; use Objects to group fields and Lists for repeating content.
				</li>
				<li>
					Select a field and enter content. Wait for Saved. If a save fails,
					your local draft stays available; use Save status to retry or resolve
					a conflict before switching projects.
				</li>
				<li>
					Use field Properties to configure required values, number limits,
					choices and media thumbnails. Article images and media uploads are
					verified before saving.
				</li>
				<li>
					Open <Link href="/users">Users</Link> to invite an editor or viewer.
					An invitation grants access after the recipient verifies their email
					and accepts it.
				</li>
				<li>
					Open <Link href="/publication">Publication</Link>, review the saved
					draft, then confirm publication. Required fields must be complete.
				</li>
				<li>
					Create a standard key under <Link href="/api-keys">API keys</Link>.
					Copy it once and keep it on your website server. Preview keys read
					drafts and should only be used for private previews.
				</li>
			</ol>
			<h2>Connect a website</h2>
			<p>
				Send an HTTP POST to <code>/content/graphql</code> with{' '}
				<code>Content-Type: application/json</code> and <code>X-API-Key</code>.
				Inspect your generated schema with an authenticated GET to{' '}
				<code>/content/schema</code>. A root String named Title is queried as{' '}
				<code>{'query { Title }'}</code>.
			</p>
			<pre>
				{
					'fetch(cmsUrl + "/content/graphql", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-API-Key": process.env.GROBLIN_API_KEY },\n  body: JSON.stringify({ query: "query { Title }" })\n})'
				}
			</pre>
			<p>
				Media and article image URLs expire after one hour. Refresh the content
				query to obtain fresh URLs. Use the full URL returned by the API.
			</p>
			<h2>Recover a mistake</h2>
			<p>
				Content history lets an administrator inspect and restore the complete
				model and draft. Restoration creates another saved version. Publication
				history can roll the website back independently. Neither action replaces
				an operator backup.
			</p>
			<p>
				Projects can export a portable draft archive including media and import
				it as a new unpublished project. Archives exclude accounts, memberships,
				API keys and history.
			</p>
			<p>
				History retention is configured by your operator. The current draft and
				publication are preserved.
			</p>
		</Page>
	)
}
