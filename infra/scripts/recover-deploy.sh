#!/usr/bin/env bash
# إصلاح تعارض git على VPS ثم إكمال النشر الكامل.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

echo "==> Recover deploy — hard sync + full update"

if [[ -d "$REPO_ROOT/.git" ]]; then
  branch="${DEPLOY_BRANCH:-$(git -C "$REPO_ROOT" symbolic-ref --quiet --short HEAD 2>/dev/null || echo production)}"
  git -C "$REPO_ROOT" fetch origin "+refs/heads/${branch}:refs/remotes/origin/${branch}"
  git -C "$REPO_ROOT" reset --hard "origin/${branch}"
  git -C "$REPO_ROOT" clean -fd \
    -- admin-desktop/.next admin-desktop/out \
    web-store/.next web-store/out \
    2>/dev/null || true
fi

cd "$ROOT"
chmod +x scripts/*.sh scripts/lib/*.sh 2>/dev/null || true

exec ./scripts/update.sh --full "$@"
