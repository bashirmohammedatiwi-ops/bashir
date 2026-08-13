#!/usr/bin/env bash
# مزامنة كاملة من GitHub ثم إعادة بناء API.
# Usage: cd ~/alhayaa/infra && bash scripts/sync-from-github.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Repo: $ROOT"
echo "==> Fetch origin..."
git fetch origin

LOCAL="$(git rev-parse --short HEAD 2>/dev/null || echo 'none')"
REMOTE="$(git rev-parse --short origin/main 2>/dev/null || echo 'none')"
echo "    local main:  $LOCAL"
echo "    origin/main: $REMOTE"

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "==> Reset hard to origin/main ($REMOTE)..."
  git reset --hard origin/main
else
  echo "==> Already on origin/main ($REMOTE)"
fi

echo "==> Latest commit:"
git log -1 --oneline

cd "$ROOT/infra"
bash scripts/update-api.sh

echo ""
echo "Sync complete. Commit on server: $(git -C "$ROOT" rev-parse --short HEAD)"
