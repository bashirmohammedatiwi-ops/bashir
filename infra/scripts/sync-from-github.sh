#!/usr/bin/env bash
# Legacy entry — now runs the full update (git + API + admin + store).
# Usage: cd ~/alhayaa && bash infra/scripts/sync-from-github.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "==> sync-from-github.sh → full update (pull.sh)"
exec bash "$ROOT/infra/scripts/update.sh" "$@"
