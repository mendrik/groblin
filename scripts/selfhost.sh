#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
exec docker compose --env-file "$root/deploy/.env" -f "$root/deploy/compose.yml" "$@"
