#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd -- "$root"
pnpm --filter frontend dev &
frontend_pid=$!
pnpm --filter backend server &
backend_pid=$!
cleanup() { kill "$frontend_pid" "$backend_pid" 2>/dev/null || true; wait "$frontend_pid" "$backend_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait -n "$frontend_pid" "$backend_pid"
