# Release notes

## 0.1.0 self hosted v1 candidate

The editor now keeps draft content separate from immutable publication snapshots. Model changes are validated before commit, conflicting edits require review, and saved history supports confirmed restoration. Failed saves preserve browser drafts.

Projects support verified invitations, canonical Owner/Admin/Editor/Viewer permissions, switching, lifecycle operations and ownership transfer. Account settings support name changes, verification and password changes that revoke other sessions. Lists provide scoped search, typed sorting, filters and pagination.

Imports preview actual changes and confirm against a source fingerprint and project version. Portable project archives include verified media and remap IDs into a new unpublished project. Articles support verified images; uploads include progress, cancellation, metadata and durable cleanup.

All npm workspace dependencies have been upgraded. The GraphQL 17 editor API now uses SDL and generated server/client types; TypeScript 7, React 19, Tailwind 4 and current editor APIs are supported.

The single-host deployment adds validated configuration, SMTP or SES email, restricted registration, private S3-compatible storage, tracked migrations, bounded history retention, readiness checks, structured request logs, graceful shutdown and complete backup/restore commands. MIT is the project license.

### Upgrade compatibility

Take a complete database and media backup. Migrations support the preceding unversioned baseline and revoke previously exposed plaintext API keys. Issue new website keys after upgrading. Public keys require a publication; use preview keys for saved drafts. Media URLs now expire after one hour. Portable project archives do not replace full deployment backups. Downgrades require restoration of a matching backup.

The supported deployment runs one backend process. Hosted billing, multi-region operation, shared notification infrastructure, webhooks and scheduled publication are outside the self-hosted v1 scope.
