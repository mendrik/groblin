# Security reporting

Report vulnerabilities privately through the repository's GitHub Security page when private reporting is available. If no private reporting option is shown, open an issue requesting a private contact and omit vulnerability details until the maintainer supplies that contact. Never publish credentials, cookies, invitation links, database dumps or private project content in issues.

Include the affected version, configuration relevant to the issue, reproduction steps, expected impact and a redacted request ID. The maintained self-hosted release is the supported security target; older development deployments should upgrade after taking a backup.

## Previously committed configuration and data

Earlier history included environment files and a database dump. Removing these files from the current tree does not remove them from repository history or existing clones. Operators who used those values must rotate database passwords, AWS credentials, authentication secrets and media signing secrets through their own providers, invalidate affected sessions and replace exposed API keys. Treat dump content as exposed and assess it independently.

Migration 002 revokes every legacy plaintext API key. New API keys are generated randomly, displayed once and stored as SHA-256 fingerprints. Changing the authentication secret invalidates old authentication material; after a suspected session exposure also clear affected sessions through an operator incident procedure. Changing the media signing secret invalidates previously signed media URLs; refreshing content produces new URLs.

The repository check rejects tracked environment files and private database dumps. Historical credential rotation and repository history rewriting are operator actions: this change does not rotate external credentials or rewrite existing history. After rotating values, verify old keys and sessions fail and that new publication and media requests succeed. Preserve evidence and notify affected users when appropriate.
