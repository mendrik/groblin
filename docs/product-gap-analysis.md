# Groblin self hosted v1 gap analysis

Assessed on 30 September 2026. The target is a dependable, MIT-licensed CMS that an operator can run on one host. The product must support a complete journey from installation and inviting an editor to publishing a website, recovering a mistake, upgrading and restoring a backup.

The three implementation stages now cover that journey. The remaining work is production rollout, remediation of credentials used by older deployments, and broader product improvements outside the agreed v1 scope. Passing local release checks establishes a release candidate; it does not mean a public release or a production deployment has occurred.

## Requirements and evidence

| Area | Former gap | Current result | Evidence |
| --- | --- | --- | --- |
| Dependencies | Old libraries and incompatible APIs | Direct workspace dependencies upgraded, lockfile refreshed, breaking APIs migrated | Workspace manifests; `pnpm outdated -r`; type checks and build |
| Type safety | Manually maintained API and database shapes | Internal SDL and generated server/client types; isolated database type generation | `schema.graphql`; `pnpm schema:api`; `types:db:isolated` |
| Content safety | Invalid settings, models and list paths could commit | Shared validation, complete generated-schema validation, exact list ancestry, serialized writes | Content, settings, model-validation and isolation integration tests |
| Destructive actions | Deletes lacked a reliable review and acknowledgement | Impact previews, fingerprints checked at commit, confirmation and retained errors | Deletion-impact integration and dialog tests |
| Saves | Lost acknowledgement or reload could lose edits | Account/project-scoped durable browser drafts, save feedback, retry and explicit conflict review | Save-queue tests; deployed interruption/reload browser check |
| Concurrent editing | Stale edits could overwrite newer content | Required revision tokens and project locks; pending inputs preserve focus during remote updates | Separate-connection lock tests; two-tab browser conflict check |
| Recovery | No complete content history or restore | Immutable revisions, preview and confirmed atomic restore, bounded retention | Revision and retention tests; browser mistake recovery |
| Projects | Incomplete creation, switching and lifecycle | Create, switch, versioned rename, confirmed deletion and ownership transfer | Project workflow tests; browser project isolation |
| Team access | Invitations and permissions were incomplete | Verified, expiring invitations; Owner/Admin/Editor/Viewer roles; fresh authorization for writes and subscriptions | Workflow and subscription tests; live browser role revocation |
| Account settings | Profile actions were incomplete | Name, verification and password changes with other-session revocation | Real BetterAuth integration and profile UI tests |
| Publishing | Draft edits immediately affected consumers | Immutable publications, draft preview keys and publication rollback | Publication integration/UI tests; deployed example consumer website |
| Lists | Scope, filters and pagination were unreliable | Nested scope, literal search, typed filters/sort, totals and bounded pagination | List integration and UI tests |
| Imports | Changes could not be reviewed safely | Bounded JSON imports, real rollback previews, identity matching, fingerprint/version confirmation | Import integration and UI tests |
| Portability | No complete project round trip | Versioned archives with model/settings/content/media; new unpublished copies; ID remapping and idempotent retries | Archive integration and UI tests, including article images |
| Media | Unverified uploads, weak feedback and incomplete cleanup | Progress/cancel, byte/type/dimension verification, immutable sealed objects, private signed URLs and durable cleanup | Media/SDK/UI tests; actual browser upload and download |
| Articles | Image insertion and safe output were incomplete | Verified image insertion and canonical sanitized HTML with retained asset references | Article sanitizer and image-button tests |
| Deployment | No repeatable production package | Versioned application images, pinned service images, private database/storage and Caddy routing | `deploy/`; clean Docker build and deployed browser checks |
| Configuration | Unsafe defaults and unclear registration/limits | Startup validation, generated separate secrets, invite registration, SMTP/SES and bounded resources | Config tests; fresh bootstrap/invited registration and uninvited rejection |
| Migrations | No tracked upgrade procedure | Serialized transactional runner, checksums, baseline upgrade and downgrade refusal | Migration integration tests; deployed migration restart |
| Backup | No demonstrated full recovery | Checksummed database/media/config backup; empty-target restore; corruption and overwrite refusal | `scripts/verify-selfhost.sh`; restored browser/API/media checks |
| Operations | No readiness or reliable shutdown | Liveness/readiness, migration/storage checks, request IDs, JSON logs and draining shutdown | Health test; deployed readiness and shutdown logs |
| Onboarding | No complete first-project guidance | Built-in guide, operator and content/API documentation, working consumer example | `/guide`; self-hosting guide; installation browser test |
| Release hygiene | No license, release notes or reporting path | MIT, changelog, bug template, security procedure and tracked-private-file guard | `LICENSE`; `CHANGELOG.md`; `SECURITY.md`; CI |

Integration tests use real disposable PostgreSQL databases with transaction rollback. Storage and email SDK mocks make failure cases reproducible; the deployed checks also exercise the bundled storage and SMTP delivery through Mailpit. The local deployment uses HTTP, so public DNS, certificate issuance and a real email provider remain rollout checks.

The current generated SDK passes compilation and API tests with GraphQL 17. Its upstream code generator still declares a GraphQL 16 peer range, so package installation reports that compatibility warning. Two deprecated transitive packages also remain upstream; the final dependency audit reports no vulnerabilities.

## Remaining rollout work

| Priority | Work | Owner | Completion criterion |
| --- | --- | --- | --- |
| Before public use of an affected old installation | Rotate previously committed credentials, invalidate affected sessions/keys, assess exposed dump content and decide whether to rewrite repository history | Operator and maintainer | Old credentials fail; replacement login, API and media requests work; incident actions recorded |
| Before production launch | Configure real domains, HTTPS and email delivery | Operator | Both origins have valid certificates; signup/reset/invitation email delivery and browser media uploads work from an external client |
| Before production launch | Schedule encrypted off-host backups and health/disk alerts | Operator | A backup reaches independent storage; a scheduled restore drill passes; alert delivery is demonstrated |
| Before announcing a release | Review and merge changes, run repository CI, create the versioned release and designate a private security contact | Maintainer | CI passes for the reviewed commit; release notes and a usable private reporting channel accompany the release |

The repository guard verifies that environment files and the private database dump are absent from tracked files. Migration 002 revokes legacy plaintext API keys. A read-only history inspection confirms earlier private files remain in Git history. No external credential rotation, history rewrite, release publication or production deployment was performed by this work.

## Improvements after v1

These are product gaps for a larger offering, rather than requirements for the agreed single-host release.

| Priority | Gap | Why it matters | Proposed next milestone |
| --- | --- | --- | --- |
| P2 | Browser, accessibility and small-screen coverage | The complete deployed suite currently covers desktop Chromium; it is not a WCAG audit or a Safari/Firefox/mobile compatibility claim | Run WebKit/Firefox and keyboard/screen-reader/mobile acceptance checks; address observed failures |
| P2 | Performance and scale evidence | The entry bundle is about 1.15 MB minified, 346 KB gzip; large-project throughput and restore duration have no published benchmark | Split editor-heavy routes and benchmark representative field/list/media datasets on a stated host |
| P2 | Richer consumer compatibility review | Valid GraphQL models can still introduce consumer-breaking changes when published | Show a schema diff at publication and document a compatibility/versioning policy |
| P2 | Automated operational visibility | Health and JSON logs exist; metrics, dashboards and centrally managed alert rules are operator responsibilities | Add measurable storage/cleanup/backup indicators and a sample alert configuration |
| P2 | Stronger identity and governance | MFA/SSO, organizations and a dedicated security audit trail are not part of v1 | Define a team/security milestone before claiming enterprise readiness |
| P3 | Editorial automation | Scheduled publication, approval workflows and webhooks are absent | Add these when a concrete publishing workflow requires them |
| P3 | Localization and a browsable asset library | Content localization and a standalone asset-management experience are absent | Validate requirements with editors before expanding the model |
| P3 | Managed hosting and high availability | Billing, quotas, multi-host replication and shared editor notifications are absent | A separate hosted-product milestone; the supported v1 runs one backend process |

## Verification and acceptance

The release gate is executable with `scripts/verify-selfhost.sh`. It creates its own disposable Compose projects, runs installation and resilience browser checks, backs up and restores the complete deployment, repeats migration/startup checks, verifies refusal cases and removes only those disposable projects. It requires a local configuration for `owner@example.invalid` and refuses an already running local deployment.

CI also checks generated schema/database artifacts, tracked private files, compilation, lint, coverage, build and the dependency audit. See [release progress](../.release/progress.json) for the final counts and coverage checkpoint, [self hosting](self-hosting.md) for operator procedures, and [content and API](content-and-api.md) for editorial and website integration.
