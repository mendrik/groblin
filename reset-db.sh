#!/usr/bin/env bash
set -euo pipefail
[[ "${1:-}" = --confirm ]] || { echo 'This deletes the development database. Run reset-db.sh --confirm to continue.' >&2; exit 1; }
cd -- "$(dirname -- "$0")"
docker compose down -v
docker compose up -d --wait
(cd backend && pnpm db:migrate)
