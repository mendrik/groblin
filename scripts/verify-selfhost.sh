#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root"
node --input-type=module - "$root/deploy/.env" <<'JS'
import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'
const env = parse(readFileSync(process.argv[2]))
if (env.PUBLIC_URL !== 'http://localhost:8088' || env.STORAGE_PUBLIC_URL !== 'http://localhost:9008' || env.BOOTSTRAP_EMAIL !== 'owner@example.invalid')
  throw new Error('Release verification requires a local configuration generated for owner@example.invalid')
try {
  await fetch(env.PUBLIC_URL, { signal: AbortSignal.timeout(2000) })
  throw new Error('Stop the existing local deployment before release verification')
} catch (error) {
  if (error.message === 'Stop the existing local deployment before release verification') throw error
}
JS
working=$(mktemp -d -t groblin-release-XXXXXXXX)
suffix=$(basename "$working" | tr '[:upper:]' '[:lower:]')
source_project="$suffix-source"
restore_project="$suffix-restore"
compose=("$root/scripts/selfhost.sh")
cleanup() {
  local result=$?
  "${compose[@]}" -p "$source_project" --profile local down --volumes >/dev/null 2>&1 || true
  "${compose[@]}" -p "$restore_project" --profile local down --volumes >/dev/null 2>&1 || true
  rm -rf -- "$working"
  return "$result"
}
trap cleanup EXIT
export E2E_FIXTURE_PATH="$working/fixture.json"
"${compose[@]}" -p "$source_project" --profile local up -d --build
E2E_PHASE=installation pnpm exec playwright test e2e/selfhost.spec.ts
E2E_PHASE=resilience pnpm exec playwright test e2e/resilience.spec.ts
COMPOSE_PROJECT_NAME="$source_project" scripts/backup.sh "$working/backup"
node scripts/verify-backup.mjs "$working/backup"
"${compose[@]}" -p "$source_project" --profile local stop proxy backend storage mailpit
COMPOSE_PROJECT_NAME="$restore_project" scripts/restore.sh "$working/backup"
"${compose[@]}" -p "$restore_project" --profile local up -d
E2E_PHASE=restore pnpm exec playwright test e2e/restored.spec.ts
# Restarting the current release reapplies no migrations and keeps the restored data.
"${compose[@]}" -p "$restore_project" run --rm migrate
"${compose[@]}" -p "$restore_project" restart backend
"${compose[@]}" -p "$restore_project" up -d proxy
E2E_PHASE=upgrade pnpm exec playwright test e2e/restored.spec.ts
if COMPOSE_PROJECT_NAME="$restore_project" scripts/restore.sh "$working/backup" > "$working/refusal.log" 2>&1; then
  echo 'Restore unexpectedly accepted a populated database' >&2; exit 1
fi
[[ "$(cat "$working/refusal.log")" == *'Restore requires an empty target database'* ]] || { cat "$working/refusal.log" >&2; exit 1; }
cp -a -- "$working/backup" "$working/corrupt"
printf '\0' >> "$working/corrupt/database.dump"
if node scripts/verify-backup.mjs "$working/corrupt" > "$working/corrupt.log" 2>&1; then
  echo 'Backup verification unexpectedly accepted corruption' >&2; exit 1
fi
[[ "$(cat "$working/corrupt.log")" == *'Backup checksum mismatch: database.dump'* ]] || { cat "$working/corrupt.log" >&2; exit 1; }
E2E_PHASE=refusal pnpm exec playwright test e2e/restored.spec.ts
echo 'Installation, publication, recovery, permissions, backup restore, migration restart and refusal checks passed'
