# Self hosting Groblin

This guide installs the versioned single-host deployment and explains upgrades, backups and recovery. The package runs Caddy, one Groblin backend, PostgreSQL 17 and private S3-compatible SeaweedFS storage. Application and storage HTTPS origins must both be reachable by browsers.

## Install on a server

1. Point two DNS names at the server, for example `cms.example.com` and `media.example.com`. Allow inbound TCP 80 and 443. Keep database, storage administration and backend ports private.
2. Check out the chosen release and install dependencies with `pnpm install --frozen-lockfile`.
3. Run `node scripts/setup-selfhost.mjs owner@example.com https://cms.example.com https://media.example.com`. This creates `deploy/.env` with unique credentials and mode 0600; an existing configuration is preserved.
4. Set `SMTP_URL` and `EMAIL` in `deploy/.env` to a working SMTP service. Use `smtps://` for implicit TLS or `smtp://` for STARTTLS; URL-encode credentials. `EMAIL_TRANSPORT=ses` uses configured AWS SES credentials instead. The included Mailpit service only runs with the `local` profile.
5. Run `scripts/selfhost.sh up -d --build`. Migrations and storage setup finish before the backend starts. Caddy obtains HTTPS certificates for the configured names.
6. Check `https://cms.example.com/health/ready`. Register with `BOOTSTRAP_EMAIL`, verify the email, sign in and follow `/guide`. Invite other accounts through the Users page.

Caddy routes `/graphql` to the editor WebSocket API, `/content/graphql` to the public content API, `/content/schema` to the generated SDL, and `/api/auth` and `/media` to the backend. The storage origin serves signed object requests. Unauthenticated object reads are denied. Application media links require a session or a bounded signature.

The bundled storage uses the upstream [SeaweedFS single-node mini deployment](https://github.com/seaweedfs/seaweedfs#quick-start). Runtime service images are pinned by digest in `deploy/compose.yml` and the Dockerfiles. Application images use `GROBLIN_VERSION`; source builds are available with `--build`. There is no published registry image assumed by these instructions.

## Configure limits and registration

Startup validates required URLs, secrets, email configuration, ports, pool size and retention. Configuration errors identify the setting without printing its value. `REGISTRATION_MODE=invite` admits the configured initial owner and accounts with an unexpired, unrevoked invitation. `open` allows public registration; `closed` admits only the bootstrap address. Existing accounts can still sign in in every mode. Password creation requires at least 12 characters.

`DB_POOL_MAX` defaults to 10. Database queries time out after 30 seconds. Editor WebSocket messages and proxy application bodies are limited to 64 KiB; each editor connection allows at most 32 concurrent operations. Public queries allow at most 12 levels and 200 expanded selections. `MAX_PROJECT_FIELDS` defaults to 2000, including the project root. List pages are limited to 100 items. JSON imports are limited to 10 MiB; media uploads to 20 MiB; compressed project archives to 64 MiB and expanded archives to 128 MiB. Images are verified and limited to 40 million pixels and 16384 pixels per dimension. Upload URLs expire after 15 minutes.

`HISTORY_DAYS=30`, `HISTORY_LIMIT=1000` and `PUBLICATION_LIMIT=100` govern background pruning. Retention preserves the current draft and publication, retained publication history and versions created in the past hour. That hour protects issued media URLs. Referenced media stays available until its last retained reference disappears. Unused uploads and exports expire after 24 hours; cleanup failures retry with stored error and attempt counters. Keep disk and database usage under observation; retention is not a replacement for backups.

## Back up

Keep backups off the application host. A project export is a portable saved draft; it excludes accounts, memberships, API keys, history and publication state. An operator backup includes all database state, the storage volume and configuration.

```sh
scripts/backup.sh /absolute/path/to/new-backup-directory
node scripts/verify-backup.mjs /absolute/path/to/new-backup-directory
```

The backup command briefly stops the proxy, backend and storage to freeze writes. It dumps PostgreSQL in custom format, archives the complete bundled storage volume, writes checksums, and restarts services. The directory contains `database.dump`, `media.tar`, `config.env` and `manifest.json`. Treat it as secret material: it contains credentials, password hashes and private content. Encrypt it before moving it to shared storage. Back up daily and before every upgrade; choose off-host retention appropriate to your content.

For a named deployment, set `COMPOSE_PROJECT_NAME` on every command, including backup and restore. An external S3 provider needs a separate provider backup procedure; the supplied backup scripts specifically cover the bundled storage volume.

## Restore

Restore to a new Compose project or a separate host. The restore command refuses an existing database or populated media volume.

1. Verify backup checksums with `node scripts/verify-backup.mjs /absolute/backup`.
2. Securely copy `config.env` to `deploy/.env` on the restore host. Preserve authentication and media signing secrets. Adjust hostnames and exposed ports if testing alongside another deployment.
3. Set a new `COMPOSE_PROJECT_NAME`, then run `scripts/restore.sh /absolute/backup`. The command starts an empty database, restores storage and database state, runs migrations and starts the application.
4. Check readiness, sign in, inspect projects and history, query the public API with an existing key, and fetch a media URL returned by that query. An earlier media URL remains usable only within its one-hour expiry. Only switch traffic after those checks pass.

Do not restore over the sole working copy of your data. For testing on the same host, stop the source proxy and backend before starting the restored deployment on the same public ports. Backup verification detects corrupted files and rejects archive paths or links that could escape the media volume.

## Upgrade

1. Read the target release notes. Take and verify a complete backup.
2. Stop the proxy and backend with `scripts/selfhost.sh stop proxy backend`.
3. Check out the target release; preserve `deploy/.env`. Run `pnpm install --frozen-lockfile` and `scripts/selfhost.sh build`.
4. Run `scripts/selfhost.sh run --rm migrate`. Migrations are serialized with an advisory lock, applied transactionally, and recorded with checksums. Previous plaintext API keys are revoked during upgrade; issue replacement keys through the application.
5. Run `scripts/selfhost.sh up -d` and check readiness, login, public queries and media.

Downgrades are refused. Roll back by restoring the pre-upgrade backup with its matching application release to a fresh deployment. The upgrade runner accepts the previous unversioned baseline schema; an untracked database with newer development-only changes requires a fresh installation or a backup containing the migration ledger. It fails explicitly instead of guessing which changes have already run.

## Monitor and shut down

`/health/live` reports the HTTP process; `/health/ready` checks database migration checksums and storage access and returns 503 while draining. Docker checks readiness. Logs are JSON events with request IDs, status, route category and duration; they omit request bodies, cookies, API keys, email links and media tokens. Inspect `scripts/selfhost.sh logs backend` and service health after an incident.

SIGTERM and SIGINT drain HTTP and WebSocket servers, stop background cleanup, wait for work and close database and SDK clients. Docker allows 35 seconds; `SHUTDOWN_TIMEOUT_MS` defaults to 30000. The supported package uses one backend process because editor update notifications are in memory. Multiple backend replicas require shared notifications and additional coordination before they are supported.
