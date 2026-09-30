# Groblin

Groblin is a self-hosted headless CMS. Define a tree of fields, edit content with your team, and publish a read-only GraphQL API for a website. Saved drafts and published snapshots are separate. This repository targets a dependable self-hosted v1; the deployment package is versioned as 0.1.0 and verified locally as a release candidate.

The product includes Owner, Admin, Editor and Viewer roles, verified invitations, project switching, profile settings, conflict detection, local draft recovery, content history, publication rollback, nested lists with search and filtering, article images, verified private media uploads, and portable project archives.

## Start locally

Requires Docker Compose v2, Node 24 or later, and pnpm 10.19.0.

```sh
pnpm install --frozen-lockfile
node scripts/setup-selfhost.mjs owner@example.com
scripts/selfhost.sh --profile local up -d --build
```

Open http://localhost:8088 and register with the configured owner email. Local verification emails appear at http://localhost:8028. The local email service is for development and release verification.

For a server with HTTPS and real email, follow [Self hosting](docs/self-hosting.md). Follow the built-in `/guide` for a first project, or read [Content and API guide](docs/content-and-api.md). A small [consumer website](examples/consumer/server.mjs) demonstrates using a server-side API key.

## Verify changes

```sh
pnpm schema:api
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm --filter frontend build
pnpm audit
```

Database types come from `pnpm --filter backend types:db:isolated`. SQL initialization is generated from the baseline and migration files with `pnpm --filter backend schema:db:build`. Backend database tests use disposable PostgreSQL containers and roll back test transactions.

For the complete release check, generate local configuration with `node scripts/setup-selfhost.mjs owner@example.invalid`, install Chromium with `pnpm exec playwright install chromium`, then run `scripts/verify-selfhost.sh`. The command creates disposable Compose projects, checks browser workflows and complete backup restoration, and removes its test projects. Stop any existing local deployment first. The configuration generator preserves an existing `deploy/.env`.

To check installation alone against a fresh disposable deployment, run `pnpm exec playwright test e2e/selfhost.spec.ts`. Browser checks create synthetic accounts and content; use the configured owner email `owner@example.invalid`.

## Operate and contribute

See [the v1 gap analysis](docs/product-gap-analysis.md), [backup, restore and upgrades](docs/self-hosting.md), [security reporting](SECURITY.md), and [release notes](CHANGELOG.md). Report reproducible bugs through repository issues; include the application version, browser, failing workflow and redacted request ID. Never attach credentials, cookies, private content or database dumps to an issue.

The supported v1 deployment runs one backend process on one host. Replication, hosted billing, organization management, scheduled publication, webhooks and high availability are outside this release scope.

Licensed under [MIT](LICENSE). Dependencies and deployment services retain their own licenses.
