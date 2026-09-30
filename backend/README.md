# Groblin backend

The backend requires Node 24 or later, pnpm 10.19.0, PostgreSQL 17, and private S3-compatible storage. Use the [self-hosting guide](../docs/self-hosting.md) for a complete local or production deployment, SMTP email, upgrades, backup and restore. The [content guide](../docs/content-and-api.md) explains roles, publication and the public API.

## Develop

Copy `.env.template` to `.env` and supply real local settings and separate authentication/media signing secrets. Startup validates this configuration. The root development Compose file provides PostgreSQL only. After `docker compose up -d`, run `pnpm --filter backend db:migrate` with the backend working directory and environment before starting `pnpm --filter backend server`. Start `pnpm --filter frontend dev` separately; Vite proxies editor, authentication, media and public content requests. Local SMTP and S3 services or configured external development services are required.

`database/base.sql` is the supported preceding baseline. Ordered migration files contain schema changes; `scripts/build-database-schema.ts` generates `database/init.sql` for disposable test initialization. Production installs use the tracked migration runner, not PostgreSQL's one-time initialization directory. Do not modify a migration after it has been deployed; add another version.

```sh
pnpm --filter backend schema:db:build
pnpm --filter backend types:db:isolated
pnpm schema:api
pnpm typecheck
pnpm lint
pnpm test:coverage
```

Database and internal API types are generated. The root `schema.graphql` is the editor API contract. Regenerate the public API test SDK from synthetic fixtures with `pnpm --filter backend schema:test`. `dump_db.sh` exports schema only; never recreate test fixtures from live data.

## Test isolation and coverage

Backend tests use disposable PostgreSQL containers. Each database case begins and rolls back a transaction. `tests/rollback-database.ts` maps resolver transactions to real savepoints, serializes connection leases, and recovers expected statement errors. Separate connection tests verify lock behavior. Migration tests also run within rollback transactions using nested savepoints. External SDKs are mocked at their client boundary; staging checks use actual email, object storage and browsers.

Coverage reports include application source and exclude generated types and tests. Backend gates retain 80% overall lines, 95% resolver lines and 100% security helper/connection authentication lines. Frontend coverage retains a lower whole-UI baseline with stronger authentication/client gates. Passing coverage does not establish full browser or deployment verification; run the Playwright release flow against a fresh, separate local stack.
