#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
backup=${1:?Usage: scripts/backup.sh /absolute/new-backup-directory}
[[ "$backup" = /* ]] || { echo 'Use an absolute destination' >&2; exit 1; }
mkdir -- "$backup"
compose=("$root/scripts/selfhost.sh")
restart() { "${compose[@]}" up -d storage backend proxy >/dev/null; }
"${compose[@]}" stop proxy backend storage >/dev/null
trap restart EXIT
"${compose[@]}" exec -T db pg_dump -U groblin -d groblin --format=custom --no-owner > "$backup/database.dump"
"${compose[@]}" run --rm -T --no-deps --entrypoint tar storage -C /data -cf - . > "$backup/media.tar"
cp -- "$root/deploy/.env" "$backup/config.env"
BACKUP_DIRECTORY="$backup" node "$root/scripts/backup-manifest.mjs"
echo "Backup complete: $backup"
