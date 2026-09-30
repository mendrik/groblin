#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if [[ -f .env ]]; then
 set -a
 source .env
 set +a
fi
: "${DATABASE_URL:?Set DATABASE_URL}"
# Export schema only. Test fixtures must never come from a live database.
pg_dump "$DATABASE_URL" --schema-only --no-comments --no-owner --no-privileges --file ./database/init.sql
