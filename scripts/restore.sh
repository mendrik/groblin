#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
backup=${1:?Usage: scripts/restore.sh /absolute/backup-directory}
[[ "$backup" = /* ]] || { echo 'Use an absolute backup path' >&2; exit 1; }
node "$root/scripts/verify-backup.mjs" "$backup"
compose=("$root/scripts/selfhost.sh")
"${compose[@]}" up -d db >/dev/null
for attempt in {1..30}; do
 if "${compose[@]}" exec -T db pg_isready -U groblin -d groblin >/dev/null; then break; fi
 sleep 1
done
count=$("${compose[@]}" exec -T db psql -U groblin -d groblin -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
[[ "$count" = 0 ]] || { echo 'Restore requires an empty target database. Use a new Compose project; the current database was preserved.' >&2; exit 1; }
"${compose[@]}" stop proxy backend storage >/dev/null
"${compose[@]}" run --rm -T --no-deps --entrypoint sh storage -c 'test -z "$(find /data -mindepth 1 ! -type d -print -quit)"' || { echo 'Restore requires an empty media volume' >&2; exit 1; }
"${compose[@]}" run --rm -T --no-deps --entrypoint tar storage -C /data -xf - < "$backup/media.tar"
"${compose[@]}" exec -T db pg_restore -U groblin -d groblin --no-owner --exit-on-error < "$backup/database.dump"
"${compose[@]}" up -d storage migrate storage-setup backend proxy >/dev/null
echo 'Restore complete. Check /health/ready and sign in to verify content and media.'
