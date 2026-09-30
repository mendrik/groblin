# Content and API guide

Groblin organizes one project's model as a tree. Root and Object nodes group fields; List nodes hold repeated items; String, Article, Number, Boolean, Choice, Date, Color and Media nodes store typed content. Field names become GraphQL names, so use valid identifiers and distinct sibling names. Model changes are validated before they commit.

## Create and publish

Open Home, choose Add node, create a String named `Title`, enter text and wait for All changes saved. Add Objects to group content or a List with child fields for repeated items. Use Properties for required fields, choices, numeric limits and thumbnails. Articles include formatting, tables and verified local images. Uploads report progress, metadata, errors and cancellation.

Use Users to invite members. An Owner has full project control, including ownership transfer and deletion. Admins manage models, members, keys and publication. Editors change content and list items. Viewers read content. Project changes are scoped per request, so selecting a different project in another tab cannot retarget an existing edit.

Open Publication, review the saved draft, continue and confirm. Standard API keys read the published snapshot. Preview keys read the latest saved draft. A model change stays private until publication. Missing required content blocks publication. Create a standard key under API keys; copy it once. The server stores its hash, and disabling or expiring the key takes effect on the next request.

## Query content

From a website server, POST JSON to `/content/graphql` with `Content-Type: application/json` and `X-API-Key`. Keep the key in server configuration; placing it in browser code grants its holder access to the whole project API. Fetch `/content/schema` with the same header to discover generated types and list filters.

```graphql
query {
  Title
}
```

The public API is read-only. Lists support generated filters, ordering and bounded pagination. Media returns `url`, `contentType` and configured `url_SIZE` thumbnail fields. Article HTML contains sanitized formatting and signed image URLs. URLs expire after one hour: refresh the content query, and use the full returned URL. Original files other than images are downloaded as attachments.

Run the sample website with:

```sh
GROBLIN_URL=https://cms.example.com GROBLIN_API_KEY=your-key node examples/consumer/server.mjs
```

It reads the published `Title` on the server, escapes it into a page and returns a useful unavailable response when content cannot be retrieved.

## Saves and recovery

Save status distinguishes unconfirmed, failed, saving and conflicting edits. Unconfirmed content remains in account and project scoped browser storage. Use Retry save after a connection failure. For a conflict, review the latest saved version before choosing your edit or the server's version. Pending edits block project switching, import and restore. Unreadable browser recovery data is preserved for inspection.

Content history shows immutable saved snapshots. An administrator can inspect and confirm a restore of the complete model, settings and content. Restore checks the current version and creates a new revision. Publication rollback changes the website's snapshot without changing the draft. Retained versions keep their referenced media. Ask your operator about retention limits.

## Import and export

JSON Array imports populate list items; JSON Object imports populate objects or the root. Upload a file, review proposed counts, then confirm. Structure changes require an administrator. External IDs match existing items within the exact project, list and parent path; duplicate source IDs are rejected. Confirmation is bound to both the reviewed source and current project version.

Projects can export a versioned gzip archive of the saved draft, model, settings, nested lists and checksummed media. Import previews counts and creates a new owned, unpublished project with remapped IDs and media. Retried confirmations return the same project. Accounts, memberships, API keys, history and publication state are excluded. Operator backups cover complete deployment recovery.
