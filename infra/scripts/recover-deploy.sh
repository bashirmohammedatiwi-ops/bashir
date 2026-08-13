#!/usr/bin/env bash
# إصلاح تعارض git على VPS ثم إكمال النشر الكامل.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

echo "==> Recover deploy — hard sync + full update"

if [[ -d "$REPO_ROOT/.git" ]]; then
  git -C "$REPO_ROOT" fetch origin main
  git -C "$REPO_ROOT" reset --hard origin/main
  git -C "$REPO_ROOT" clean -fd \
    -- admin-desktop/.next admin-desktop/out \
    web-store/.next web-store/out \
    2>/dev/null || true
fi

cd "$ROOT"
chmod +x scripts/*.sh scripts/lib/*.sh 2>/dev/null || true

exec ./scripts/update.sh --full "$@"
